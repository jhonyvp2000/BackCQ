import * as fs from "fs";
import * as path from "path";

const filePath = path.join(__dirname, "../src/app/dashboard/programaciones/surgery-form.tsx");
let content = fs.readFileSync(filePath, "utf8");

// We need to replace:
// 1. {dxSearchTerm && ( -> {dxSearchTerm && enableQuickAdd && (
// 2. {postDxSearchTerm && ( -> {postDxSearchTerm && enableQuickAdd && (
// 3. {procSearchTerm && ( -> {procSearchTerm && enableQuickAdd && (
// 4. {intSearchTerm && ( -> {intSearchTerm && enableQuickAdd && (

const replacements = [
    { target: "{dxSearchTerm && (", replacement: "{dxSearchTerm && enableQuickAdd && (" },
    { target: "{postDxSearchTerm && (", replacement: "{postDxSearchTerm && enableQuickAdd && (" },
    { target: "{procSearchTerm && (", replacement: "{procSearchTerm && enableQuickAdd && (" },
    { target: "{intSearchTerm && (", replacement: "{intSearchTerm && enableQuickAdd && (" }
];

let modified = false;
for (const rep of replacements) {
    if (content.includes(rep.target)) {
        content = content.replace(rep.target, rep.replacement);
        console.log(`Replaced: ${rep.target} -> ${rep.replacement}`);
        modified = true;
    } else {
        console.warn(`Target not found: ${rep.target}`);
    }
}

if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Successfully updated surgery-form.tsx with feature flags!");
} else {
    console.log("No changes made.");
}
