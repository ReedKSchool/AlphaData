/// <reference path="../typings/index.d.ts" />
import * as _ from "lodash";
import fs = require("fs");
import path = require("path");
import mkdirp = require("mkdirp");

interface filterfunction{
  (data:any):boolean;
}
interface editFunction{

}

class alphaDataBase{
  private internal_obj;
  private internal_selected_items;
  private internal_location;
  constructor(location:string){
    this.internal_location = location;
    this.loadDB();
  }
  private loadDB():void{
    let this_reference = this;
    mkdirp.sync(path.dirname(this_reference.internal_location));
    if(fs.existsSync(this_reference.internal_location))
      this.internal_obj = JSON.parse(fs.readFileSync(this_reference.internal_location,"utf-8"));
    else
      this.internal_obj = {};
  }
  public makeTable(name:string):this{
    if(!this.tableExists(name))
      this.internal_obj[name] = [];
    else{
      throw Error("Table already exists.");
    }
    return this;
  }
  public deleteTable(name:string):this{
    if(!this.tableExists(name))
      throw Error("Table does not exist");
    delete this.internal_obj[name];  
    return this;
  }
  public initTables(tables:Array<string>):this{
    tables.forEach((table)=>{
      if(!this.tableExists(table)){
        this.makeTable(table);
      }
    })
    return this;
  }
  public tableExists(name:string):boolean{
    let this_reference = this;
    return (Object.keys(this_reference.internal_obj).indexOf(name) > -1);
  }
  public select(input:filterfunction|string):this{
    let this_reference = this;
    if(typeof input === "string"){
      let temp_obj = {};
      temp_obj[input] = _.range(0,this_reference.internal_obj[input].length);
      this.internal_selected_items = temp_obj;
    }
    else if(typeof input === "function"){
      let keys = Object.keys(this_reference.internal_obj);
      let passing_tables = keys.filter(input);
      let temp_obj = {};
      passing_tables.forEach((table_name)=>{
         temp_obj[table_name] = _.range(0,this_reference.internal_obj[table_name].length); 
         this_reference.internal_selected_items = temp_obj;
      });
    }
    return this;
  }
  public where(input:filterfunction):this{
    let this_reference = this;
    let keys = Object.keys(this_reference.internal_selected_items);
    keys.forEach((key)=>{
      let passing_items = [];
      this_reference.internal_selected_items[key].forEach((index)=>{
        let condition = input(this_reference.internal_obj[key][index]);
        if(condition){
          passing_items.push(index);
        }
      })
      this_reference.internal_selected_items[key] = passing_items;
    })
    return this;
  }
  public getSelected(fields?:Array<string>):any{
    let this_reference = this;
    let keys = Object.keys(this_reference.internal_selected_items);
    let obj_to_return = [];
    keys.forEach((key)=>{
      this_reference.internal_selected_items[key].forEach((val)=>{
        if(fields !== undefined && fields.length > 0 && Array.isArray(fields)){
          let obj_with_selected = {};
          fields.forEach((field)=>{
            obj_with_selected[field] = this_reference.internal_obj[key][val][field]
          })
          obj_to_return.push(obj_with_selected);
        }
        else
          obj_to_return.push(this_reference.internal_obj[key][val]);
      })
    })
    return obj_to_return;
  }
  public insert(input:any):this{
    let this_reference = this;
    let keys = Object.keys(this_reference.internal_selected_items);
    keys.forEach((key)=>{
      this_reference.internal_obj[key].push(input);
    });
    return this;
  }
  public edit(func:editFunction):this{
    let this_reference = this;
    let keys = Object.keys(this_reference.internal_selected_items);
    keys.forEach((key)=>{
      this_reference.internal_obj[key].forEach(func);
    });  
    return this;
  }
  public write():void{
    let this_reference = this;
    fs.writeFileSync(this_reference.internal_location,JSON.stringify(this_reference.internal_obj));
  }
  public deleteItem():this{
    let this_reference = this;
    let keys = Object.keys(this_reference.internal_selected_items);
    keys.forEach((key)=>{
      for(let a = this_reference.internal_obj[key].length;a>0;a--){
        if(this_reference.internal_selected_items[key].indexOf(a - 1)>-1){
          this_reference.internal_obj[key].splice(a -1,1);
        }
      }
    })
    return this;
  }
}
module.exports = alphaDataBase;