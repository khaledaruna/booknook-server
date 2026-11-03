
import { ObjectId } from "mongodb";

export interface Book {
  _id?: ObjectId | string;
  title: string;
  author: string;
  category: "Fiction" | "Science" | "History" | "Kids" | "Others";
  image: string;
  description: string;
  addedBy: {
    name: string;
    email: string;
  };
  createdAt: Date;
}

export interface BorrowRecord {
  _id?: ObjectId | string;
  bookId: ObjectId | string;
  bookTitle: string;
  bookImage: string;
  userEmail: string;
  userName: string;
  borrowDate: Date;
  returnDate: Date;
}