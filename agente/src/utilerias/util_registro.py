class Records:
    """Utilidades para trabajar con los artículos y categorías (dicts) que devuelven las tools."""

    @staticmethod
    def flatten(data) -> list[dict]:
        """Los dicts que haya en data, que puede ser un dict, una lista o una lista de listas de resultados."""
        parts = data if isinstance(data, list) else [data]
        return [i for part in parts for i in (part if isinstance(part, list) else [part]) if isinstance(i, dict)]

    @classmethod
    def unique(cls, items: list[dict]) -> list[dict]:
        """Une los repetidos por tipo e id; el dato más reciente gana, pero no pisa campos con vacíos."""
        merged: dict = {}
        for item in items:
            key = (cls.is_article(item), item.get("id", id(item)))
            filled = {k: v for k, v in item.items() if v is not None and v != ""}
            merged[key] = {**merged.get(key, {}), **filled}
        return list(merged.values())

    @staticmethod
    def is_article(item: dict) -> bool:
        return "categoryId" in item or "needsRepair" in item

    @classmethod
    def is_category(cls, item: dict) -> bool:
        return "id" in item and "name" in item and not cls.is_article(item)
