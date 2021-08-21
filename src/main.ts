import BracketsViewer from './viewer/braketsViewer';
import InMemoryDatabase from './manager/inMemoryDatabase';
import {BracketsManager} from 'brackets-manager';

window.bracketsViewer = new BracketsViewer();
window.inMemoryDatabase = new InMemoryDatabase();
window.bracketsManager = new BracketsManager(window.inMemoryDatabase);
