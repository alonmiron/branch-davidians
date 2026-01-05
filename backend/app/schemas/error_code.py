from pydantic import BaseModel

class ErrorCodeResponse(BaseModel):
    id: int
    response_code: str
    description: str

    class Config:
        from_attributes = True



