import { describe,expect,it } from "vitest";
import { formValues,initialFormState } from "@/lib/form-state";

describe("form state",()=>{it("starts empty",()=>expect(initialFormState).toEqual({}));it("turns fields into a plain record and ignores file values",()=>{const data=new FormData();data.set("name"," Goa ");data.set("attachment",new Blob(["x"]),"x.txt");expect(formValues(data)).toEqual({name:" Goa ",attachment:""})});});
