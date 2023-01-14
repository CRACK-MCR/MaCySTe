use std::collections::{HashMap, BTreeSet};
use std::net::SocketAddr;
use std::ops::{Deref, DerefMut};
use std::sync::Arc;

use axum::extract::ws::Message as WebSocketMessage;
use axum::extract::ws::WebSocket;
use axum::extract::{Path, WebSocketUpgrade, State};
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Router;
use futures::future::select;
use futures::{StreamExt, SinkExt, pin_mut};
use tokio::sync::Mutex;
use tokio::sync::mpsc::{Receiver, Sender};
use tracing::instrument;

type SenderIdentity = u64;
struct Identified<T>(SenderIdentity, T);
impl<T> Identified<T> {
    pub fn new(id: SenderIdentity, content: T) -> Self {
        Self(id, content)
    }
    pub fn id(&self) -> &SenderIdentity {
        &self.0
    }
}
impl<T> Deref for Identified<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.1
    }
}
impl<T> DerefMut for Identified<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.1
    }
}

#[derive(Default)]
struct WebSocketMessageDispatcher {
    subscriptions: HashMap<String, Vec<Identified<Sender<WebSocketMessage>>>>,
    identities: BTreeSet<SenderIdentity>,
}
impl WebSocketMessageDispatcher {

    #[instrument(skip(self))]
    pub fn get_topics(&self) -> Vec<String> {
        self.subscriptions.keys().map(String::from).collect()
    }

    #[instrument(skip(self))]
    pub fn remove_closed(&mut self) {
        let topics = self.get_topics();
        for topic in topics {
            self.remove_closed_for_topic(&topic);
        }
    }

    #[instrument(skip(self))]
    pub fn remove_closed_for_topic(&mut self, topic: &str) {
        if let Some(senders) = self.subscriptions.get_mut(topic) {
            // Find which senders are closed
            let mut to_remove = Vec::new();
            for (i, sender) in senders.iter().enumerate() {
                if sender.is_closed() {
                    to_remove.push(i);
                }
            }
            // Remove them
            to_remove.sort_unstable();
            for i in to_remove.iter().rev() {
                let sender = senders.remove(*i);
                let id = sender.id();
                self.identities.remove(id);
                tracing::info!(id, "Removed subscriber");
            }
        }
    }

    #[instrument(skip(self, message))]
    pub fn send(&mut self, topic: &str, sender_identity: &SenderIdentity, message: &WebSocketMessage) {
        if let Some(senders) = self.subscriptions.get_mut(topic) {
            let mut do_cleanup = false;
            for sender in senders {
                if sender.id() == sender_identity {
                    continue;
                }
                if let Err(err) = sender.try_send(message.clone()) {
                    match err {
                        tokio::sync::mpsc::error::TrySendError::Full(_) => {}
                        tokio::sync::mpsc::error::TrySendError::Closed(_) => {
                            do_cleanup = true;
                        }
                    }
                }
            }
            if do_cleanup {
                self.remove_closed();
            }
        }
    }

    #[instrument(skip(self))]
    pub fn subscribe(&mut self, topic: &str) -> Identified<Receiver<WebSocketMessage>> {
        let (tx, rx) = tokio::sync::mpsc::channel(65536);
        if let Some(senders) = self.subscriptions.get_mut(topic) {
            // Generate sender identitiy
            let identity = {
                if let Some(max_i) = self.identities.last() {
                    max_i + 1
                } else {
                    0
                }
            };
            // Add sender
            senders.push(Identified::new(identity, tx));
            self.identities.insert(identity);
            // Log something
            let count = senders.len();
            let total_count = self.identities.len();
            tracing::info!(count, total_count, identity, "Added subscriber");
            Identified::new(identity, rx)
        } else {
            self.subscriptions.insert(topic.to_owned(), Vec::new());
            tracing::info!("Initialized subscribers for topic");
            self.subscribe(topic)
        }
    }
}

type ServerState = Arc<Mutex<WebSocketMessageDispatcher>>;

async fn websocket_handler(
    Path(key): Path<String>,
    State(state): State<ServerState>,
    ws: WebSocketUpgrade
) -> impl IntoResponse {
    ws.on_upgrade(|ws| websocket(ws, key, state))
}

async fn websocket(socket: WebSocket, topic: String, state: ServerState) {
    tracing::info!("Handling");
    // Subscribe to topic
    let mut subscription = {
        let mut state = state.lock().await;
        state.subscribe(&topic)
    };
    let subscription_identity = subscription.id().to_owned();
    // Spawn send task
    let (ping_tx, mut ping_rx) = tokio::sync::mpsc::channel::<Vec<u8>>(16);
    let (mut sender, mut receiver) = socket.split();
    let send_task = tokio::task::spawn(async move {
        loop {
            let ping_recv = ping_rx.recv();
            let subs_recv = subscription.recv();
            pin_mut!(ping_recv);
            pin_mut!(subs_recv);
            match select(ping_recv, subs_recv).await {
                futures::future::Either::Left((ping, _)) => match ping {
                    Some(content) => {
                        let content_len = content.len();
                        if let Err(err) = sender.send(WebSocketMessage::Pong(content)).await {
                            tracing::debug!(error = ?err, "WS send error while sending pong");
                            break;
                        }
                        tracing::debug!(size = content_len, "Sent pong");
                    },
                    None => {
                        tracing::debug!("Ping channel closed");
                        break;
                    },
                },
                futures::future::Either::Right((msg, _)) => match msg {
                    Some(message) => {
                        if let Err(err) = sender.send(message).await {
                            tracing::debug!(error = ?err, "WS send error while sending message");
                            break;
                        }
                    },
                    None => {
                        tracing::debug!("Messages channel closed");
                        break;
                    },
                },
            }
        }
        tracing::debug!("Terminating send task");
    });
    // Spawn receive task
    let recv_task_topic = topic.clone();
    let recv_task_state = state.clone();
    let recv_task = tokio::task::spawn(async move {
        while let Some(message) = receiver.next().await {
            match message {
                Ok(message) => match message {
                    WebSocketMessage::Text(_) | WebSocketMessage::Binary(_) => {
                        let mut state = recv_task_state.lock().await;
                        state.send(&recv_task_topic, &subscription_identity, &message);
                        tracing::debug!(?message, "Received message");
                    },
                    WebSocketMessage::Ping(content) => {
                        if ping_tx.send(content).await.is_err() {
                            tracing::debug!("Could not forward ping data");
                            break;
                        }
                    },
                    WebSocketMessage::Pong(_) => tracing::debug!("Received pong"),
                    WebSocketMessage::Close(_) => {
                        tracing::debug!("Received close");
                        break;
                    },
                },
                Err(error) => tracing::error!(err = ?error, "Error receiving from WS"),
            }
        }
        tracing::debug!("Terminating receive task");
    });
    // Await both tasks
    select(send_task, recv_task).await;
    tracing::info!("Websocket connection closed");
    // Perform cleanup
    tokio::task::spawn(async move { state.lock().await.remove_closed_for_topic(&topic) });
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    let state = Arc::new(Mutex::new(WebSocketMessageDispatcher::default()));
    let router = Router::new()
        .route("/:key", get(websocket_handler))
        .with_state(state)
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .layer(tower_http::compression::CompressionLayer::new());
    // Parse bind port
    let server_port = std::env::var("BIND_PORT").unwrap_or("3000".to_string());
    let server_port: u16 = server_port.parse().expect("Could not parse BIND_PORT");
    let server_addr = SocketAddr::from((std::net::Ipv4Addr::UNSPECIFIED, server_port));
    tracing::info!(address = ?server_addr, "Starting");
    axum::Server::bind(&server_addr)
        .serve(router.into_make_service())
        .with_graceful_shutdown(async { tokio::signal::ctrl_c().await.unwrap() })
        .await?;
    Ok(())
}
