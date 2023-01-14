use std::{collections::HashMap, env, net::{Ipv4Addr, SocketAddr}, process::exit, str::FromStr, sync::Arc};

use anyhow::Context;
use axum::extract::State;
use axum::response::Html;
use axum::{Router, extract::{Path, WebSocketUpgrade, ws::{Message, WebSocket}}, response::IntoResponse, routing::get};
use futures_util::{StreamExt, SinkExt};
use hyper::StatusCode;
use tokio::sync::Mutex;
use tokio::task::JoinSet;
use tokio::{net::UdpSocket, sync::broadcast};
use serde::Deserialize;
use tokio_util::sync::CancellationToken;
use tracing::instrument;

#[derive(Debug, Deserialize)]
enum ProxyKind {
  BINARY,
  TEXT
}

#[derive(Debug)]
struct ProxySpec {
  path: String,
  addr: SocketAddr,
}
impl FromStr for ProxySpec {
  type Err = ();

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    let components: Vec<&str> = s.split_terminator(':').take(4).collect();
    if components.len() == 3 {
      let path = components[0].to_string();
      let addr_and_port = components[1..=2].join(":");
      let addr: SocketAddr = addr_and_port.parse().expect("Could not parse address");
      Ok(Self { path, addr })
    } else {
      Err(())
    }
  }
}

fn get_proxy_specs_from_env() -> Vec<ProxySpec> {
  match env::var("PROXIES") {
    Ok(val) => val
      .split_terminator(' ')
      .map(str::parse::<ProxySpec>)
      .filter(Result::is_ok)
      .map(Result::unwrap)
      .collect(),
    Err(_) => Vec::new(),
  }
}

#[derive(Debug)]
struct Listener {
  pub bind_address: SocketAddr,
  pub sender: broadcast::Sender<Vec<u8>>,
}
impl Listener {
  pub fn new(bind_address: &SocketAddr) -> Self {
    let bind_address = bind_address.to_owned();
    let (sender, _) = broadcast::channel(65536);
    Self { bind_address, sender }
  }
  #[tracing::instrument(skip(cancellation_token,sender))]
  pub async fn run(bind_address: SocketAddr, cancellation_token: CancellationToken, sender: broadcast::Sender<Vec<u8>>) -> anyhow::Result<()> {
    let sock = match bind_address {
      SocketAddr::V4(addr) => {
        let ip = addr.ip();
        if ip.is_multicast() {
          let sock = UdpSocket::bind(SocketAddr::from((Ipv4Addr::UNSPECIFIED, addr.port()))).await.context("Failed binding UDP socket")?;
          let join_addr = std::env::var("PROXIES_MULTICAST_INTERFACE").map(|if_addr| if_addr.parse::<Ipv4Addr>().unwrap()).unwrap_or(Ipv4Addr::UNSPECIFIED);
          sock.join_multicast_v4(ip.clone(), join_addr)?;
          tracing::info!(?join_addr, "Joined multicast");
          sock
        } else {
          UdpSocket::bind(bind_address).await.context("Failed binding UDP socket")?
        }
      },
      _ => todo!()
    };
    tracing::info!("Bound socket");
    let mut recv_buffer = [0;65536];
    loop {
      tokio::select! {
        _ = cancellation_token.cancelled() => {
          tracing::info!("Cancelled");
          break;
        },
        recv_result = sock.recv(&mut recv_buffer) => {
          match recv_result {
            Ok(size) => {
              tracing::debug!(?size, "Received");
              let received = &recv_buffer[..size];
              if sender.send(received.to_vec()).is_err() {
                tracing::debug!("No receivers");
              }
            },
            Err(e) => {
              tracing::error!(error = ?e, "Receive error");
              break;
            }
          }
        }
      }
    }
    tracing::info!("Terminated");
    Ok(())
  }
}

#[derive(Debug, Default)]
struct Listeners {
  cancellation_token: CancellationToken,
  by_path: HashMap<String, Listener>,
  tasks: Mutex<JoinSet<anyhow::Result<()>>>,
}
impl Listeners {
  pub fn from_proxies_spec(cancellation_token: CancellationToken, proxies: &[ProxySpec]) -> Self {
    let mut by_path = HashMap::with_capacity(proxies.len());
    let mut tasks = JoinSet::new();
    for proxy in proxies {
      let listener = Listener::new(&proxy.addr);
      tasks.spawn(Listener::run(listener.bind_address.clone(), cancellation_token.child_token(), listener.sender.clone()));
      by_path.insert(proxy.path.clone(), listener);
    }
    let tasks = Mutex::new(tasks);
    Self {
      cancellation_token,
      by_path,
      tasks,
    }
  }
  #[tracing::instrument]
  pub async fn terminate(&self) {
    // Send termination
    self.cancellation_token.cancel();

    // Wait for all tasks
    tracing::debug!("Awaiting tasks termination");
    let mut tasks = self.tasks.lock().await;
    while let Some(_) = tasks.join_next().await {
    }
    assert!(tasks.is_empty());
    tracing::debug!("Tasks terminated");
  }
}

async fn index_handler(
  State(listeners): State<Arc<Listeners>>,
) -> impl IntoResponse {
  let mut page = "<!DOCTYPE html><html><head></head><body><h1>Available websockets</h1><nav><ul>".to_string();
  for path in listeners.by_path.keys() {
    page.push_str(&format!("<li><span>{path}</span>"));
    page.push_str(&format!("<a href=\"/{path}/BINARY/js\"> (as binary)</a>"));
    page.push_str(&format!("<a href=\"/{path}/TEXT/js\"> (as text)</a>"));
    page.push_str("</li>");
  }
  page.push_str("</ul></nav></body></html>");
  Html(page)
}

async fn js_handler(
  Path((path, proxy_kind)): Path<(String, ProxyKind)>,
  State(listeners): State<Arc<Listeners>>,
) -> impl IntoResponse {
  if ! listeners.by_path.contains_key(&path) {
    StatusCode::NOT_FOUND.into_response()
  } else {
    let mut page = "<!DOCTYPE html><html><head></head><body><div>Status: <span id=\"sts\">---</span></div><hr/><div id=\"ctr\"></div>".to_string();
    page.push_str(&format!("<script>const wsURL = \"/{path}/{proxy_kind:?}\"</script>"));
    page.push_str("<script src=\"/ws_js\"></script>");
    page.push_str("</body></html>");
    Html(page).into_response()
  }
}

async fn ws_js_handler() -> impl IntoResponse {
  (
    StatusCode::OK,
    [
      (hyper::http::header::CONTENT_TYPE, "text/javascript"),
    ],
    include_str!("../assets/ws.js")
  )
}

async fn ws_handler(
  ws: WebSocketUpgrade,
  Path((path, proxy_kind)): Path<(String, ProxyKind)>,
  State(listeners): State<Arc<Listeners>>,
) -> impl IntoResponse {
  if ! listeners.by_path.contains_key(&path) {
    StatusCode::NOT_FOUND.into_response()
  } else {
    ws.on_upgrade(|ws| ws_on_upgrade_handler(ws, listeners, path, proxy_kind))
  }
}

#[instrument(skip(socket, listeners))]
async fn ws_on_upgrade_handler(socket: WebSocket, listeners: Arc<Listeners>, path: String, proxy_kind: ProxyKind) {
  // Split the websocket
  let (mut ws_sender, mut ws_receiver) = socket.split();

  // Grab associated listener
  let listener = listeners.by_path.get(&path).unwrap();

  // Receive and ignore from the other websocket
  tokio::task::spawn(async move {
    while let Some(_) = ws_receiver.next().await {
      tracing::debug!("Discarding received message");
    }
  });

  // Grab receiver
  let mut receiver = listener.sender.subscribe();
  tracing::debug!("Subscribed");

  // Send to websocket
  loop {
    match receiver.recv().await {
      Ok(data) => {
        let message = match proxy_kind {
          ProxyKind::BINARY => Message::Binary(data),
          ProxyKind::TEXT => Message::Text(String::from_utf8_lossy(&data).to_string()),
        };
        match ws_sender.send(message).await {
          Ok(_) => tracing::debug!("Sent data"),
          Err(error) => {
            tracing::debug!(?error, "Error sending data to websocket");
            break;
          },
        }
      },
      Err(err) => match err {
        broadcast::error::RecvError::Closed => {
          tracing::debug!("Listener channel closed");
          break;
        },
        broadcast::error::RecvError::Lagged(amount) => {
          tracing::warn!(?amount, "Slow consumer lagged");
        },
      }
    }
  }

  // Close remote websocket
  match ws_sender.close().await {
    Ok(_) => tracing::debug!("Closed remote websocket"),
    Err(e) => tracing::debug!(error = ?e, "Could not close remote websocket"),
  }
}

#[tokio::main]
async fn main() {
  // Initialize logger
  tracing_subscriber::fmt::init();
  // Grab proxies
  let proxy_specs = get_proxy_specs_from_env();
  if proxy_specs.len() == 0 {
    tracing::error!("Please set the PROXIES variable!");
    exit(1);
  }
  // Initialize shutdown
  let shutdown_token = CancellationToken::new();
  // Initialize listeners
  let listeners = Arc::new(Listeners::from_proxies_spec(shutdown_token.child_token(), &proxy_specs));
  // Prepare Axum
  let app = Router::new()
    .route("/", get(index_handler))
    .route("/ws_js", get(ws_js_handler))
    .route("/:ws_path/:kind", get(ws_handler))
    .route("/:ws_path/:kind/js", get(js_handler))
    .with_state(listeners.clone())
    .layer(tower_http::compression::CompressionLayer::new())
    .layer(tower_http::trace::TraceLayer::new_for_http());
  // Parse bind port
  let server_port = std::env::var("BIND_PORT").unwrap_or("9090".to_string());
  let server_port: u16 = server_port.parse().expect("Could not parse BIND_PORT");
  // Start shutdown task
  let ctrl_c_token = shutdown_token.clone();
  tokio::task::spawn(async move {
    let _ = tokio::signal::ctrl_c().await;
    tracing::info!("Received ctrl+c");
    ctrl_c_token.cancel();
  });
  // Start Axum
  axum::Server::bind(&SocketAddr::from((std::net::Ipv4Addr::UNSPECIFIED, server_port)))
    .serve(app.into_make_service())
    .with_graceful_shutdown(async {
      shutdown_token.cancelled().await;
      listeners.terminate().await;
    })
    .await
    .unwrap();
}
