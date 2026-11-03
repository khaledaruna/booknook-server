
import { ObjectId } from "mongodb";

export interface Borrow {
  _id?: ObjectId;

  bookId: ObjectId;

  bookTitle: string;

  bookImage: string;

  userEmail: string;

  borrowDate: Date;

  returnDate: Date;

  returned: boolean;

  createdAt: Date;
}
