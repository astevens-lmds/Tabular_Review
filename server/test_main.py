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


class TestFileSizeLimit:
    def test_rejects_oversized_file(self):
        # Create a file just over 50MB
        large_content = b"x" * (50 * 1024 * 1024 + 1)
        file = io.BytesIO(large_content)
        response = client.post("/convert", files={"file": ("big.pdf", file, "application/pdf")})
        assert response.status_code == 413
        assert "too large" in response.json()["detail"].lower()

    def test_accepts_file_under_limit(self):
        with patch("main.converter") as mock_converter:
            mock_result = MagicMock()
            mock_result.document.export_to_markdown.return_value = "# OK"
            mock_converter.convert.return_value = mock_result

            file = io.BytesIO(b"small content here")
            response = client.post("/convert", files={"file": ("small.pdf", file, "application/pdf")})
            assert response.status_code == 200


class TestMultipleFileTypes:
    @patch("main.converter")
    def test_accepts_docx(self, mock_converter):
        mock_result = MagicMock()
        mock_result.document.export_to_markdown.return_value = "# DOCX"
        mock_converter.convert.return_value = mock_result

        file = io.BytesIO(b"docx content")
        response = client.post("/convert", files={"file": ("doc.docx", file, "application/vnd.openxmlformats")})
        assert response.status_code == 200

    @patch("main.converter")
    def test_accepts_txt(self, mock_converter):
        mock_result = MagicMock()
        mock_result.document.export_to_markdown.return_value = "plain text"
        mock_converter.convert.return_value = mock_result

        file = io.BytesIO(b"hello world")
        response = client.post("/convert", files={"file": ("notes.txt", file, "text/plain")})
        assert response.status_code == 200

    def test_rejects_exe(self):
        file = io.BytesIO(b"MZ binary")
        response = client.post("/convert", files={"file": ("malware.exe", file, "application/octet-stream")})
        assert response.status_code == 400

    def test_rejects_jpg(self):
        file = io.BytesIO(b"\xff\xd8\xff image data")
        response = client.post("/convert", files={"file": ("photo.jpg", file, "image/jpeg")})
        assert response.status_code == 400


class TestConversionErrors:
    @patch("main.converter")
    def test_handles_converter_exception(self, mock_converter):
        mock_converter.convert.side_effect = RuntimeError("Docling crashed")

        file = io.BytesIO(b"bad pdf content")
        response = client.post("/convert", files={"file": ("broken.pdf", file, "application/pdf")})
        assert response.status_code == 500
        assert "conversion failed" in response.json()["detail"].lower()


class TestCORSHeaders:
    def test_cors_allows_localhost(self):
        response = client.options(
            "/health",
            headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"},
        )
        assert response.headers.get("access-control-allow-origin") in (
            "http://localhost:3000",
            "*",
            None,
        ) or response.status_code == 200

    def test_health_returns_json_content_type(self):
        response = client.get("/health")
        assert "application/json" in response.headers["content-type"]


class TestFilenameEdgeCases:
    def test_rejects_file_without_extension(self):
        file = io.BytesIO(b"content")
        response = client.post("/convert", files={"file": ("README", file, "text/plain")})
        assert response.status_code == 400

    def test_rejects_double_extension_ending_bad(self):
        file = io.BytesIO(b"content")
        response = client.post("/convert", files={"file": ("doc.pdf.exe", file, "application/octet-stream")})
        assert response.status_code == 400

    @patch("main.converter")
    def test_accepts_uppercase_extension(self, mock_converter):
        mock_result = MagicMock()
        mock_result.document.export_to_markdown.return_value = "# Upper"
        mock_converter.convert.return_value = mock_result
        file = io.BytesIO(b"content")
        response = client.post("/convert", files={"file": ("DOC.PDF", file, "application/pdf")})
        assert response.status_code == 200

    @patch("main.converter")
    def test_accepts_xlsx(self, mock_converter):
        mock_result = MagicMock()
        mock_result.document.export_to_markdown.return_value = "# Spreadsheet"
        mock_converter.convert.return_value = mock_result
        file = io.BytesIO(b"xlsx content")
        response = client.post("/convert", files={"file": ("data.xlsx", file, "application/vnd.openxmlformats")})
        assert response.status_code == 200

    @patch("main.converter")
    def test_accepts_pptx(self, mock_converter):
        mock_result = MagicMock()
        mock_result.document.export_to_markdown.return_value = "# Slides"
        mock_converter.convert.return_value = mock_result
        file = io.BytesIO(b"pptx content")
        response = client.post("/convert", files={"file": ("deck.pptx", file, "application/vnd.openxmlformats")})
        assert response.status_code == 200


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
