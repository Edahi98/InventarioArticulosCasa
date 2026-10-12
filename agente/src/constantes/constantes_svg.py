MAX_SVG = 20_000
SVG_OUTPUT_WIDTH = 512
SVG_FILENAME = "imagen.png"

SVG_ALLOWED_TAGS = frozenset({
    "svg", "g", "defs", "title", "desc", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon",
    "text", "tspan", "linearGradient", "radialGradient", "stop", "clipPath", "mask", "use", "symbol",
})
SVG_FORBIDDEN_MARKUP = ("<!doctype", "<!entity", "<?xml-stylesheet", "<![cdata[")
SVG_LOCAL_REFERENCE = "#"
SVG_EVENT_PREFIX = "on"
SVG_LINK_ATTRIBUTES = frozenset({"href", "src"})

SVG_ERRORS = {
    "empty": "el SVG está vacío",
    "markup": "el SVG usa marcado que no se permite (DOCTYPE, entidades o CDATA)",
    "parse": "el SVG no es XML válido",
    "root": "el elemento raíz debe ser <svg>",
    "tag": "el SVG usa el elemento <{tag}>, que no se permite",
    "event": "el SVG tiene el atributo {name}, que no se permite",
    "link": "el SVG referencia recursos externos; solo se permiten referencias internas (#id)",
    "url": "el SVG usa url() hacia fuera del documento; solo se permite url(#id)",
}
