from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# 为了让 Base.metadata 看到所有模型，我们需要在这里导入它们
# 注意：在这些模型内部要使用 from app.db.base import Base 
# 这里导入可能会引起循环，通常放在一个单独的 meta.py 或者通过导入顺序解决
