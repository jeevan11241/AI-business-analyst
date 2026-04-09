from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class SuggestionResponse(BaseModel):
    id: int
    suggestion_text: str
    reason_text: str
    priority_level: str
    model_config = ConfigDict(from_attributes=True)

class PredictionResponse(BaseModel):
    id: int
    business_data_id: int
    predicted_label: str
    risk_level: str
    probability_score: float
    suggestions: List[SuggestionResponse] = []
    model_config = ConfigDict(from_attributes=True)
