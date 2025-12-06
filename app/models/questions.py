from datetime import datetime
from bson import ObjectId

class QuestionModel:
    @staticmethod
    def create_question(db, data):
        doc = {
            "user_id": ObjectId(data["user_id"]),
            "subject": data["subject"],
            "department": data["department"],
            "question": data["question"],
            "answer": None,
            "answered": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = db.questions.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    @staticmethod
    def list_unanswered(db, skip: int = 0, limit: int = 50):
        return list(
            db.questions
            .find({"answered": False})
            .skip(skip)
            .limit(limit)
            .sort("created_at", -1)
        )

    @staticmethod
    def list_user_questions(db, user_id: str):
        return list(
            db.questions
            .find({"user_id": ObjectId(user_id)})
            .sort("created_at", -1)
        )

    @staticmethod
    def reply(db, question_id: str, answer: str):
        return db.questions.find_one_and_update(
            {"_id": ObjectId(question_id)},
            {"$set": {
                "answer": answer,
                "answered": True,
                "updated_at": datetime.utcnow()
            }},
            return_document=True
        )

    @staticmethod
    def doc_to_response(doc: dict) -> dict:
        if not doc:
            return None
        return {
            "id": str(doc["_id"]),
            "user_id": str(doc["user_id"]),
            "subject": doc["subject"],
            "department": doc["department"],
            "question": doc["question"],
            "answer": doc.get("answer"),
            "answered": doc.get("answered", False),
            "created_at": doc["created_at"],
            "updated_at": doc["updated_at"]
        }