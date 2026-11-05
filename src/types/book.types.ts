import { ObjectId } from "mongodb";

export type BookCategory =
  | "Fiction"
  | "Science"
  | "History"
  | "Kids"
  | "Others";

export interface Book {
  _id?: ObjectId;
  title: string;
  author: string;
  category: BookCategory;
  image: string;
  description: string;

  addedBy: {
    name: string;
    email: string;
  };

  totalCopies: number;
  availableCopies: number;

  createdAt: Date;
  updatedAt: Date;
}

// Only fields that the owner can edit
export type BookUpdateInput = Partial<
  Pick<
    Book,
    | "title"
    | "author"
    | "category"
    | "image"
    | "description"
    | "totalCopies"
  >
>;