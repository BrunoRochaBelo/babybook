from dataclasses import dataclass


@dataclass(frozen=True)
class Quota:
    used: int
    limit: int

    def exceeded(self) -> bool:
        return self.used >= self.limit
