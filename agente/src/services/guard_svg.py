import re
import xml.etree.ElementTree as ET

from src.constantes.constantes_svg import (
    SVG_ALLOWED_TAGS,
    SVG_ERRORS,
    SVG_EVENT_PREFIX,
    SVG_FORBIDDEN_MARKUP,
    SVG_LINK_ATTRIBUTES,
    SVG_LOCAL_REFERENCE,
)


class SvgGuard:
    """Valida un SVG generado por el modelo: solo formas y degradados, sin scripts ni recursos externos."""

    _EXTERNAL_URL = re.compile(r"url\(\s*['\"]?\s*(?!#)", re.IGNORECASE)

    @classmethod
    def check(cls, svg: str) -> str:
        """Retorna el SVG si es seguro; lanza ValueError con el motivo si no lo es."""
        text = svg.strip()
        cls._require(bool(text), "empty")
        cls._require(not any(mark in text.lower() for mark in SVG_FORBIDDEN_MARKUP), "markup")
        root = cls._parse(text)
        cls._require(cls._local(root.tag) == "svg", "root")
        for element in root.iter():
            cls._check_element(element)
        return text

    @classmethod
    def _parse(cls, text: str) -> ET.Element:
        try:
            return ET.fromstring(text)
        except ET.ParseError:
            raise ValueError(SVG_ERRORS["parse"]) from None

    @classmethod
    def _check_element(cls, element: ET.Element) -> None:
        tag = cls._local(element.tag)
        if tag not in SVG_ALLOWED_TAGS:
            raise ValueError(SVG_ERRORS["tag"].format(tag=tag))
        for raw_name, value in element.attrib.items():
            cls._check_attribute(cls._local(raw_name).lower(), value)

    @classmethod
    def _check_attribute(cls, name: str, value: str) -> None:
        if name.startswith(SVG_EVENT_PREFIX):
            raise ValueError(SVG_ERRORS["event"].format(name=name))
        cls._require(name not in SVG_LINK_ATTRIBUTES or value.strip().startswith(SVG_LOCAL_REFERENCE), "link")
        cls._require(not cls._EXTERNAL_URL.search(value), "url")

    @staticmethod
    def _require(condition: bool, error: str) -> None:
        if not condition:
            raise ValueError(SVG_ERRORS[error])

    @staticmethod
    def _local(name: str) -> str:
        return name.rsplit("}", 1)[-1]
