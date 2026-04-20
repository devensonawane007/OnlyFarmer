import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os

DATA_PATH = "data/Crop_recommendation.csv"

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

def train_and_save():
    df = pd.read_csv(DATA_PATH)

    # ✅ Remove unnamed columns
    df = df.loc[:, ~df.columns.str.contains("^Unnamed")]

    # ✅ Rename columns to standard format
    df = df.rename(columns={
        "Nitrogen": "N",
        "phosphorus": "P",
        "potassium": "K"
    })

    # ✅ Keep only required columns
    df = df[FEATURES + ["label"]]

    X = df[FEATURES]
    y = df["label"]

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42
    )

    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    os.makedirs("models", exist_ok=True)
    joblib.dump(model, "models/crop_model.pkl")
    joblib.dump(le, "models/label_encoder.pkl")

    print("✅ Model trained on 7 features and saved in models/")

if __name__ == "__main__":
    train_and_save()