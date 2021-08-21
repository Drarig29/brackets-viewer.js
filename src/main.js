"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const braketsViewer_1 = __importDefault(require("./viewer/braketsViewer"));
const inMemoryDatabase_1 = __importDefault(require("./manager/inMemoryDatabase"));
const brackets_manager_1 = require("brackets-manager");
window.bracketsViewer = new braketsViewer_1.default();
window.inMemoryDatabase = new inMemoryDatabase_1.default.InMemoryDatabase();
window.bracketsManager = new brackets_manager_1.BracketsManager(window.inMemoryDatabase);
