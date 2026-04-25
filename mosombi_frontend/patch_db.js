const fs = require("fs");
let code = fs.readFileSync("../Backend/src/config/db.js", "utf8");

// Fix the bad regex replacement
code = code.replace(
  /\} else if \(f.op === 'in'\) \{ if \(Array\.isArray\(f\.value\) \&\& f\.value\.length > 0\) \{ qb\.andWhere\(colRef \+ ' IN \(:...\'\+param\+\'\)', @\{ "" = f\.value \}\); \} else \{ qb\.andWhere\('1=0'\); \} \} else if \(f\.op === 'ilike'\) \{/,
  "} else if (f.op === 'ilike') {"
);

if (!code.includes("in(column, values)")) {
  code = code.replace("  or(expression)", "  in(column, values) { this._filters.push({ op: 'in', column, value: values }); return this; }\n\n  or(expression)");
}

if (!code.includes("f.op === 'in'")) {
  code = code.replace(
    "} else if (f.op === 'ilike') {",
    "} else if (f.op === 'in') {\n" +
    "        if (Array.isArray(f.value) && f.value.length > 0) {\n" +
    "          qb.andWhere(`${colRef} IN (:...${param})`, { [param]: f.value });\n" +
    "        } else {\n" +
    "          qb.andWhere('1=0');\n" +
    "        }\n" +
    "      } else if (f.op === 'ilike') {"
  );
}

fs.writeFileSync("../Backend/src/config/db.js", code);
console.log("Patched db.js correctly");
