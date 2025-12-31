import html

def sanitize_html(value: str | None) -> str | None:
    """
    Escapes HTML characters to prevent XSS.
    """
    if value is None:
        return None
    return html.escape(value)
