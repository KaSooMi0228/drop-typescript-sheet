The primary distinctive aspect of the design of Dropsheet is the `npm run magic` tool. You'll find generated code at the end of many files marked with ``// BEGIN MAGIC -- DO NOT EDIT` this code will be regenerated when you execute `npm run magic`. The magic tool will also rerun a code prettifier while its reworking the files.

The impetus behind this tool is to provide a way to avoid boilerplate by generating it. Originally, I tried just using straight typescript, but had problems with my types decaying into more general types. However, I think that was my inexperience with Typescript when I started this project. Nevertheless, I'm not sure that even with better Typescript knowledge I could be as flexible as the code generation.

The first part of it is `//!Data` which is a comment that can be placed immediately before a typescript object type definition. These define the basic building block of data. They can be converted to/from JSON and stored as/in PostgreSQL tables.

Each field has to be one of the types with builtin support.
Right now this is: string, boolean, an array of a supported type, any `//!Data` annotated type, Money, Quantity, or Percentage (which are all typedef of Decimal.js's Decimal type), some nullable cases of those, or an enum of several possible strings.

Each `//!Data` definition can have associated functions of the form `calcNameOfDataTypeFunctionName` which are also grabbed. These becomes calculated fields that can requested from the table query interface. We support a subset of javascript that can be converted into SQL so that the same calculation can be done on the client or in the database.

The file `src/app/tables.ts` contains another bit of magic `//!Tables` This isn't really neccessary, as it all does it generate a list of the runtime objects for these tables. But that runtime list is used to define which tables exist in the database. Define new tables by adding them in here.

Dropsheet will check the postgresql database system fields against its internal record of what fields exist and modify the database to include any missing fields when it starts up.

This means that you can add fields to database simply by modifying the typescript types, running `npm run magic`, and then running dropsheet.
