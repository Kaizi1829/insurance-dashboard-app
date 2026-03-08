import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const filePath = path.join(process.cwd(),"data","objetivos.json")

export async function GET(){

const file = fs.readFileSync(filePath,"utf8")
return NextResponse.json(JSON.parse(file))

}

export async function POST(req:any){

const body = await req.json()

fs.writeFileSync(filePath,JSON.stringify(body,null,2))

return NextResponse.json({ok:true})

}