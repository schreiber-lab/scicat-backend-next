import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type TechniqueDocument = Technique & Document;

@Schema()
export class Technique {
  @Prop({ type: String, unique: true })
  pid: string;

  @Prop()
  name: string;
}

export const TechniqueSchema = SchemaFactory.createForClass(Technique);
