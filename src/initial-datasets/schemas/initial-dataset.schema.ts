import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type InitialDatasetDocument = InitialDataset & Document;

@Schema({
  collection: "InitialDataset",
})
export class InitialDataset {
  @Prop({ type: String, required: true, unique: true })
  _id: string;
}

export const InitialDatasetSchema =
  SchemaFactory.createForClass(InitialDataset);
