"""Tests for the FastAPI backend."""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import io
import time


# We need to mock docling before importing main
with patch("docling.document_converter.DocumentConverter"):
    from main import app, _rate_limit_store, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_SECONDS

client = TestClient(app)


class TestHealthEndpoint:
    def test_health_returns_ok(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestConvertEndpoint:
    def test_rejects_no_file(self):
        response = client.post("/convert")
        assert response.status_code == 422

    def test_rejects_unsupported_extension(self):
        file = io.BytesIO(b"test content")
        response = client.post("/convert", files={"file": ("image.png", file, "image/png")})
        assert response.status_code == 400
        assert "Unsupported file type" in response.json()["detail"]

    def test_rejects_empty_file(self):
        file = io.BytesIO(b"")
        response = client.post("/convert", files={"file": ("doc.pdf", file, "application/pdf")})
        assert response.status_code == 400
        assert "Empty file" in response.json()["detail"]

    @patch("main.converter")
    def test_successful_conversion(self, mock_converter):
        mock_result = MagicMock()
        mock_result.document.export_to_markdown.return_value = "# Hello World"
        mock_converter.convert.return_value = mock_result

        file = io.BytesIO(b"fake pdf content")
        response = client.post("/convert", files={"file": ("doc.pdf", file, "application/pdf")})
        assert response.status_code == 200
        assert response.json()["markdown"] == "# Hello World"


class TestRateLimiting:
    def setup_method(self):
        _rate_limit_store.clear()

    def test_rate_limit_allows_normal_traffic(self):
        # Health endpoint is not rate-limited
        for _ in range(50):
            response = client.get("/health")
            assert response.status_code == 200

    @patch("main.converter")
    def test_rate_limit_blocks_excessive_convert_requests(self, mock_converter):
        mock_result = MagicMock()
        mock_result.document.export_to_markdown.return_value = "# Test"
        mock_converter.convert.return_value = mock_result

        _rate_limit_store.clear()

        # Send max requests
        for i in range(RATE_LIMIT_MAX_REQUESTS):
            file = io.BytesIO(b"fake pdf")
            response = client.post("/convert", files={"file": ("doc.pdf", file, "application/pdf")})
            assert response.status_code == 200, f"Request {i+1} failed unexpectedly"

        # Next request should be rate-limited
        file = io.BytesIO(b"fake pdf")
        response = client.post("/convert", files={"file": ("doc.pdf", file, "application/pdf")})
        assert response.status_code == 429
        assert "Rate limit" in response.json()["detail"]


class TestOpenAPIDocs:
    def test_openapi_json_available(self):
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert data["info"]["title"] == "Tabular Review API"
        assert "/convert" in data["paths"]
        assert "/health" in data["paths"]

    def test_swagger_ui_available(self):
        response = client.get("/docs")
        assert response.status_code == 200

    def test_redoc_available(self):
        response = client.get("/redoc")
        assert response.status_code == 200
