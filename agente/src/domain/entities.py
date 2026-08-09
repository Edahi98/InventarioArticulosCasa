from dataclasses import dataclass, field


@dataclass
class Category:
    id: int
    name: str
    description: str = ""
    imageUrl: str = ""


@dataclass
class Article:
    id: int
    name: str
    categoryId: int
    stock: int = 0
    description: str = ""
    imageUrl: str = ""
    needsRepair: bool = False


@dataclass
class NewCategory:
    name: str
    description: str = ""
    imageUrl: str = ""


@dataclass
class NewArticle:
    name: str
    categoryId: int
    stock: int = 0
    description: str = ""
    imageUrl: str = ""
    needsRepair: bool = False


@dataclass
class Note:
    id: int
    title: str
    articleId: int
    description: str = ""


@dataclass
class NewNote:
    title: str
    articleId: int
    description: str = ""


@dataclass
class SearchResult:
    type: str
    id: int
    name: str
    extra: dict = field(default_factory=dict)
