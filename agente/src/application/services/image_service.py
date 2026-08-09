from ...domain.ports.i_image_repo import IImageRepo


class ImageService:
    def __init__(self, repo: IImageRepo) -> None:
        self._repo = repo

    def upload(self, data: bytes, filename: str) -> str:
        return self._repo.upload(data, filename)
