from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import List, Dict, Any
import numpy as np

app = FastAPI(title="Linear Regression API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegressionRequest(BaseModel):
    x: List[float]
    y: List[float]

    @field_validator('x', 'y')
    @classmethod
    def check_non_empty(cls, v: List[float], info) -> List[float]:
        if not v:
            raise ValueError(f"The list for '{info.field_name}' cannot be empty.")
        return v

@app.post("/api/regression")
async def calculate_regression(request: RegressionRequest):
    x = request.x
    y = request.y

    if len(x) != len(y):
        raise HTTPException(
            status_code=400,
            detail=f"X and Y must be of equal length. Got X length: {len(x)}, Y length: {len(y)}."
        )

    if len(x) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 data points are required to fit a linear regression model."
        )

    try:
        x_arr = np.array(x, dtype=float)
        y_arr = np.array(y, dtype=float)
    except (ValueError, TypeError) as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid data points. X and Y must contain numeric values only. Error: {str(e)}"
        )

    if np.all(x_arr == x_arr[0]):
        raise HTTPException(
            status_code=400,
            detail="X values must contain at least two distinct numbers. Fitting a line to identical X values results in a vertical line with undefined slope."
        )

    try:
        slope, intercept = np.polyfit(x_arr, y_arr, 1)
        slope = float(slope)
        intercept = float(intercept)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fitting the regression model: {str(e)}"
        )

    pred_arr = slope * x_arr + intercept
    predictions = pred_arr.tolist()

    mae = float(np.mean(np.abs(y_arr - pred_arr)))
    
    mse = float(np.mean((y_arr - pred_arr) ** 2))
    
    rmse = float(np.sqrt(mse))
    
    y_mean = np.mean(y_arr)
    ss_tot = np.sum((y_arr - y_mean) ** 2)
    ss_res = np.sum((y_arr - pred_arr) ** 2)
    r2 = float(1.0 - (ss_res / ss_tot) if ss_tot != 0 else 1.0)

    return {
        "slope": slope,
        "intercept": intercept,
        "predictions": predictions,
        "metrics": {
            "mae": mae,
            "mse": mse,
            "rmse": rmse,
            "r2": r2
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
