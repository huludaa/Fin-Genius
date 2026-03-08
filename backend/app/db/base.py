from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base() # 声明一个基类，所有的模型都要继承这个基类。

# 注意：在这些模型内部要使用 from app.db.base import Base 
