use std::collections::HashSet;
use std::net::SocketAddr;

use anyhow::Context;
use axum::{Router, Json};
use axum::extract::Path;
use axum::response::IntoResponse;
use axum::routing::{get_service, get};
use hyper::StatusCode;
use tokio::sync::OnceCell;

async fn handle_error<E: std::error::Error>(error: E) -> impl IntoResponse {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        format!("Error: {error:?}")
    )
}

async fn get_env_whitelist() -> &'static Option<HashSet<String>> {
    static ENV_WHITELIST: OnceCell<Option<HashSet<String>>> = OnceCell::const_new();
    ENV_WHITELIST.get_or_init(|| async {
        if let Ok(whitelist) = std::env::var("ENV_WHITELIST") {
            Some(whitelist.split_terminator(' ').map(String::from).collect())
        } else {
            None
        }
    }).await
}

async fn get_env(
    Path(env_name): Path<String>
) -> impl IntoResponse {
    if let Ok(env_value) = std::env::var(&env_name) {
        match get_env_whitelist().await {
            Some(whitelist) if whitelist.contains(&env_name) => env_value.into_response(),
            Some(_) => StatusCode::UNAUTHORIZED.into_response(),
            None => env_value.into_response(),
        }
    } else {
        match get_env_whitelist().await {
            // Prevent enumerating env variables by checking the HTTP status code
            Some(_) => StatusCode::UNAUTHORIZED.into_response(),
            None => StatusCode::NOT_FOUND.into_response(),
        }
    }
}

async fn get_env_list() -> impl IntoResponse {
    let env_whitelist = get_env_whitelist().await;
    let vars: Vec<String> = std::env::vars()
        .map(|(k, _)| k)
        .filter(|k| match env_whitelist {
            Some(whitelist) if whitelist.contains(k) => true,
            Some(_) => false,
            None => true,
        })
        .collect();
    Json(vars)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Init logging
    tracing_subscriber::fmt::init();

    // Get config from env
    let config_json_path: String = std::env::var("CONFIG_JSON_PATH").unwrap_or("config.json".into());
    let files_path: String = std::env::var("STATIC_FILES_PATH").unwrap_or(".".into());

    tracing::info!(config_json_path, files_path, "Got paths from environment");

    let bind_port: u16 = std::env::var("BIND_PORT").unwrap_or("3000".into()).parse().context("Could not parse BIND_PORT")?;

    // Build up router
    let app = Router::new()
        .route(
            "/config.json",
            get_service(tower_http::services::ServeFile::new(config_json_path)).handle_error(handle_error)
        )
        .route("/config/env", get(get_env_list))
        .route("/config/env/:env_name", get(get_env))
        .fallback_service(
            get_service(tower_http::services::ServeDir::new(files_path)).handle_error(handle_error)
        )
        .layer(tower_http::compression::CompressionLayer::new().br(true).deflate(true).gzip(true))
        .layer(tower_http::set_header::SetResponseHeaderLayer::if_not_present(axum::http::header::CACHE_CONTROL, axum::http::header::HeaderValue::from_static("no-cache")))
        .layer(tower_http::trace::TraceLayer::new_for_http());

    // Bind server
    let bind_addr = SocketAddr::from(( std::net::Ipv4Addr::UNSPECIFIED, bind_port ));
    tracing::info!(bind_address = ?bind_addr, "Starting server");
    axum::Server::bind(&bind_addr)
        .serve(app.into_make_service())
        .with_graceful_shutdown(async {
            tokio::signal::ctrl_c().await.unwrap();
        })
        .await?;
    Ok(())
}
