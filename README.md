# Augmented Keccak256

## Overview

Solidity's `keccak256` accepts a variable number of arguments of different types including structs. This code replicates the behavior in Javascript.

## Installation

`npm install https://github.com/CoinFabrik/augmented-keccak256 --save`

The above command will download and add the NodeJS module to your project.

## Usage

First include the `require` statement:
```javascript
var keccak256 = require("augmented-keccak256");
...
var hashObj = keccak256.create();
hashObj.update( data [, type_of_data] );
var hashValue = hashObj.digest();
```

You can pass any variable type as the `data` parameter. The library will attempt to identify the variable type and act according.

To override the type automatic detection, you can pass a string (or array/object containing string) to specify the type of each data memember.

Valid types are: `string, hex, boolean, uint, int, uint#, int#` (where # is a multiple of eight number between 8 and 256 like `uint64`). For addresses use `hex`.

```javascript
hashObj.update({
	text: "hello",
	value: 258,
	other_value: 666
}, {
	other_value: 'uint64'
});
```
`other_value` will be treated as an `uint64` instead of the default `int256` type.

**Tip**: If a string value is prefixed with `0x`, the value is treated as a hexadecimal number. Each pair of character will be handled as a byte component.
