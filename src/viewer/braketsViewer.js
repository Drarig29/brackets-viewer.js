"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./style.scss");
const brackets_model_1 = require("brackets-model");
const helpers_1 = require("./helpers");
const dom = __importStar(require("./dom"));
const lang = __importStar(require("./lang"));
class BracketsViewer {
    constructor() {
        this.participantRefs = {};
        this.participants = [];
        this.participantImages = [];
        this.skipFirstRound = false;
        this.alwaysConnectFirstRound = false;
        this.onMatchClicked = (_) => { };
    }
    /**
     * Renders data generated with `brackets-manager.js`. If multiple stages are given, they will all be displayed.
     *
     * Stages won't be discriminated visually based on the tournament they belong to.
     *
     * @param data The data to display.
     * @param config An optional configuration for the viewer.
     */
    render(data, config) {
        const root = document.createDocumentFragment();
        this.config = {
            participantOriginPlacement: (config === null || config === void 0 ? void 0 : config.participantOriginPlacement) || 'before',
            separatedChildCountLabel: (config === null || config === void 0 ? void 0 : config.separatedChildCountLabel) !== undefined ? config.separatedChildCountLabel : false,
            showSlotsOrigin: (config === null || config === void 0 ? void 0 : config.showSlotsOrigin) !== undefined ? config.showSlotsOrigin : true,
            showLowerBracketSlotsOrigin: (config === null || config === void 0 ? void 0 : config.showLowerBracketSlotsOrigin) !== undefined ? config.showLowerBracketSlotsOrigin : true,
            highlightParticipantOnHover: (config === null || config === void 0 ? void 0 : config.highlightParticipantOnHover) !== undefined ? config.highlightParticipantOnHover : true,
        };
        this.participants = data.participants;
        data.participants.forEach(participant => this.participantRefs[participant.id] = []);
        data.stages.forEach(stage => this.renderStage(root, {
            ...data,
            stages: [stage],
            matches: data.matches.filter(match => match.stage_id === stage.id),
        }));
        helpers_1.findRoot(config === null || config === void 0 ? void 0 : config.selector).append(root);
    }
    /**
     * Adds a locale to the available i18n bundles.
     *
     * @param name Name of the locale.
     * @param locale Contents of the locale.
     */
    addLocale(name, locale) {
        lang.i18next.addResourceBundle(name, 'translation', locale);
        lang.i18next.changeLanguage();
    }
    /**
     * Sets the images which will be rendered for every participant.
     *
     * @param images The participant images.
     */
    setParticipantImages(images) {
        this.participantImages = images;
    }
    /**
     * Renders a stage (round-robin, single or double elimination).
     *
     * @param root The root element.
     * @param data The data to display.
     */
    renderStage(root, data) {
        const stage = data.stages[0];
        const matchesByGroup = helpers_1.splitBy(data.matches, 'group_id');
        this.skipFirstRound = stage.settings.skipFirstRound || false;
        switch (stage.type) {
            case 'round_robin':
                this.renderRoundRobin(root, stage, matchesByGroup);
                break;
            case 'single_elimination':
            case 'double_elimination':
                this.renderElimination(root, stage, matchesByGroup);
                break;
            default:
                throw Error(`Unknown bracket type: ${stage.type}`);
        }
    }
    /**
     * Renders a round-robin stage.
     *
     * @param root The root element.
     * @param stage The stage to render.
     * @param matchesByGroup A list of matches for each group.
     */
    renderRoundRobin(root, stage, matchesByGroup) {
        const container = dom.createRoundRobinContainer(stage.id);
        container.append(dom.createTitle(stage.name));
        let groupNumber = 1;
        for (const groupMatches of matchesByGroup) {
            const groupId = groupMatches[0].group_id;
            const groupContainer = dom.createGroupContainer(groupId, lang.getGroupName(groupNumber++));
            const matchesByRound = helpers_1.splitBy(groupMatches, 'round_id');
            let roundNumber = 1;
            for (const roundMatches of matchesByRound) {
                const roundId = roundMatches[0].round_id;
                const roundContainer = dom.createRoundContainer(roundId, lang.getRoundName(roundNumber++, 0));
                for (const match of roundMatches)
                    roundContainer.append(this.createMatch(match));
                groupContainer.append(roundContainer);
            }
            groupContainer.append(this.createRanking(groupMatches));
            container.append(groupContainer);
        }
        root.append(container);
    }
    /**
     * Renders an elimination stage (single or double).
     *
     * @param root The root element.
     * @param stage The stage to render.
     * @param matchesByGroup A list of matches for each group.
     */
    renderElimination(root, stage, matchesByGroup) {
        const container = dom.createEliminationContainer(stage.id);
        container.append(dom.createTitle(stage.name));
        if (stage.type === 'single_elimination')
            this.renderSingleElimination(container, matchesByGroup);
        else
            this.renderDoubleElimination(container, matchesByGroup);
        root.append(container);
    }
    /**
     * Renders a single elimination stage.
     *
     * @param container The container to render into.
     * @param matchesByGroup A list of matches for each group.
     */
    renderSingleElimination(container, matchesByGroup) {
        const hasFinal = matchesByGroup[1] !== undefined;
        this.renderBracket(container, helpers_1.splitBy(matchesByGroup[0], 'round_id'), lang.getRoundName, 'single-bracket');
        if (hasFinal)
            this.renderFinal(container, 'consolation_final', matchesByGroup[1]);
    }
    /**
     * Renders a double elimination stage.
     *
     * @param container The container to render into.
     * @param matchesByGroup A list of matches for each group.
     */
    renderDoubleElimination(container, matchesByGroup) {
        const hasLoserBracket = matchesByGroup[1] !== undefined;
        const hasFinal = matchesByGroup[2] !== undefined;
        this.renderBracket(container, helpers_1.splitBy(matchesByGroup[0], 'round_id'), lang.getWinnerBracketRoundName, 'winner-bracket', hasFinal);
        if (hasLoserBracket)
            this.renderBracket(container, helpers_1.splitBy(matchesByGroup[1], 'round_id'), lang.getLoserBracketRoundName, 'loser-bracket');
        if (hasFinal)
            this.renderFinal(container, 'grand_final', matchesByGroup[2]);
    }
    /**
     * Renders a bracket.
     *
     * @param container The container to render into.
     * @param matchesByRound A list of matches for each round.
     * @param roundName A function giving a round's name based on its number.
     * @param bracketType Type of the bracket.
     * @param connectFinal Whether to connect the last match of the bracket to the final.
     */
    renderBracket(container, matchesByRound, roundName, bracketType, connectFinal) {
        const groupId = matchesByRound[0][0].group_id;
        const roundCount = matchesByRound.length;
        const bracketContainer = dom.createBracketContainer(groupId);
        const { matches: completedMatches, fromToornament } = helpers_1.completeWithBlankMatches(matchesByRound[0], matchesByRound[1], bracketType);
        this.alwaysConnectFirstRound = !fromToornament;
        for (let roundIndex = 0; roundIndex < matchesByRound.length; roundIndex++) {
            const roundId = matchesByRound[roundIndex][0].round_id;
            const roundNumber = roundIndex + 1;
            const roundContainer = dom.createRoundContainer(roundId, roundName(roundNumber, roundCount));
            const matches = fromToornament && roundNumber === 1 ? completedMatches : matchesByRound[roundIndex];
            for (const match of matches)
                roundContainer.append(match && this.createBracketMatch(roundNumber, roundCount, match, bracketType, connectFinal) || this.skipBracketMatch());
            bracketContainer.append(roundContainer);
        }
        container.append(bracketContainer);
    }
    /**
     * Renders a final group.
     *
     * @param container The container to render into.
     * @param finalType Type of the final.
     * @param matches Matches of the final.
     */
    renderFinal(container, finalType, matches) {
        const upperBracket = container.querySelector('.bracket');
        if (!upperBracket)
            throw Error('Upper bracket not found.');
        const winnerWb = matches[0].opponent1;
        const displayCount = (winnerWb === null || winnerWb === void 0 ? void 0 : winnerWb.id) === null || (winnerWb === null || winnerWb === void 0 ? void 0 : winnerWb.result) === 'win' ? 1 : 2;
        const finalMatches = matches.slice(0, displayCount);
        const roundCount = matches.length;
        for (let roundIndex = 0; roundIndex < finalMatches.length; roundIndex++) {
            const roundNumber = roundIndex + 1;
            const roundContainer = dom.createRoundContainer(finalMatches[roundIndex].round_id, lang.getFinalMatchLabel(finalType, roundNumber, roundCount));
            roundContainer.append(this.createFinalMatch(finalType, finalMatches, roundNumber, roundCount));
            upperBracket.append(roundContainer);
        }
    }
    /**
     * Creates a ranking table based on matches of a round-robin stage.
     *
     * @param matches The list of matches.
     */
    createRanking(matches) {
        const table = dom.createTable();
        const ranking = helpers_1.getRanking(matches);
        table.append(dom.createRankingHeaders(ranking));
        for (const item of ranking)
            table.append(this.createRankingRow(item));
        return table;
    }
    /**
     * Creates a row of the ranking table.
     *
     * @param item Item of the ranking.
     */
    createRankingRow(item) {
        const row = dom.createRow();
        const notRanked = item.played === 0;
        for (const key in item) {
            const prop = key;
            const data = item[prop];
            if (prop === 'id') {
                const participant = this.participants.find(participant => participant.id === data);
                if (participant !== undefined) {
                    const cell = dom.createCell(participant.name);
                    this.setupMouseHover(participant.id, cell);
                    row.append(cell);
                    continue;
                }
            }
            if (notRanked && (prop === 'rank' || prop === 'points')) {
                row.append(dom.createCell('-'));
                continue;
            }
            row.append(dom.createCell(data));
        }
        return row;
    }
    /**
     * Creates a match in a bracket.
     *
     * @param roundNumber Number of the round.
     * @param roundCount Count of rounds.
     * @param match Information about the match.
     * @param matchLocation Location of the match.
     * @param connectFinal Whether to connect this match to the final if it happens to be the last one of the bracket.
     */
    createBracketMatch(roundNumber, roundCount, match, matchLocation, connectFinal) {
        const connection = dom.getBracketConnection(this.alwaysConnectFirstRound, roundNumber, roundCount, match, matchLocation, connectFinal);
        const matchLabel = lang.getMatchLabel(match.number, roundNumber, roundCount, matchLocation) + (match.child_count > 0 ? `, Bo${match.child_count}` : '');
        const originHint = lang.getOriginHint(roundNumber, roundCount, this.skipFirstRound, matchLocation);
        return this.createMatch(match, matchLocation, connection, matchLabel, originHint, roundNumber);
    }
    /**
     * Creates a match in a final.
     *
     * @param type Type of the final.
     * @param matches Matches of the final.
     * @param roundNumber Number of the round.
     * @param roundCount Count of rounds.
     */
    createFinalMatch(type, matches, roundNumber, roundCount) {
        const roundIndex = roundNumber - 1;
        const connection = dom.getFinalConnection(type, roundNumber, matches.length);
        const matchLabel = lang.getFinalMatchLabel(type, roundNumber, roundCount);
        const originHint = lang.getFinalOriginHint(type, roundNumber);
        return this.createMatch(matches[roundIndex], 'final-group', connection, matchLabel, originHint);
    }
    /**
     * Creates a hidden empty match to act as a placeholder.
     */
    skipBracketMatch() {
        const matchContainer = dom.createMatchContainer();
        const opponents = dom.createOpponentsContainer();
        const participant1 = this.createParticipant(null);
        const participant2 = this.createParticipant(null);
        opponents.append(participant1, participant2);
        matchContainer.append(opponents);
        matchContainer.style.visibility = 'hidden';
        return matchContainer;
    }
    /**
     * Creates a match based on its results.
     *
     * @param match Results of the match.
     * @param matchLocation Location of the match.
     * @param connection Connection of this match with the others.
     * @param label Label of the match.
     * @param originHint Origin hint for the match.
     * @param roundNumber Number of the round.
     */
    createMatch(match, matchLocation, connection, label, originHint, roundNumber) {
        const matchContainer = dom.createMatchContainer(match.id, match.status);
        const opponents = dom.createOpponentsContainer(() => this.onMatchClicked(match));
        if (match.status >= brackets_model_1.Status.Completed)
            originHint = undefined;
        const participant1 = this.createParticipant(match.opponent1, 'opponent1', originHint, matchLocation, roundNumber);
        const participant2 = this.createParticipant(match.opponent2, 'opponent2', originHint, matchLocation, roundNumber);
        if (label)
            opponents.append(dom.createMatchLabel(label, lang.getMatchStatus(match.status)));
        if (match.child_count > 0 && this.config.separatedChildCountLabel)
            opponents.append(dom.createChildCountLabel(lang.bestOfX(match.child_count)));
        opponents.append(participant1, participant2);
        matchContainer.append(opponents);
        if (!connection)
            return matchContainer;
        dom.setupConnection(opponents, matchContainer, connection);
        return matchContainer;
    }
    /**
     * Creates a participant for a match.
     *
     * @param participant Information about the participant.
     * @param side Side of the participant.
     * @param originHint Origin hint for the match.
     * @param matchLocation Location of the match.
     * @param roundNumber Number of the round.
     */
    createParticipant(participant, side, originHint, matchLocation, roundNumber) {
        const containers = {
            participant: dom.createParticipantContainer(participant && participant.id),
            name: dom.createNameContainer(),
            result: dom.createResultContainer(),
        };
        if (participant === null)
            containers.name.innerText = lang.BYE;
        else
            this.renderParticipant(containers, participant, side, originHint, matchLocation, roundNumber);
        containers.participant.append(containers.name, containers.result);
        if (participant && participant.id !== null)
            this.setupMouseHover(participant.id, containers.participant);
        return containers.participant;
    }
    /**
     * Renders a participant.
     *
     * @param containers Containers for the participant.
     * @param participant The participant result.
     * @param side Side of the participant.
     * @param originHint Origin hint for the match.
     * @param matchLocation Location of the match.
     * @param roundNumber Number of the round.
     */
    renderParticipant(containers, participant, side, originHint, matchLocation, roundNumber) {
        const found = this.participants.find(item => item.id === participant.id);
        if (found) {
            containers.name.innerText = found.name;
            containers.participant.setAttribute('title', found.name);
            this.renderParticipantImage(containers.name, found.id);
            this.renderParticipantOrigin(containers.name, participant, side, matchLocation, roundNumber);
        }
        else
            this.renderHint(containers.name, participant, originHint, matchLocation);
        containers.result.innerText = `${participant.score === undefined ? '-' : participant.score}`;
        dom.setupWin(containers.participant, containers.result, participant);
        dom.setupLoss(containers.participant, containers.result, participant);
    }
    /**
     * Renders a participant image.
     *
     * @param nameContainer The name container.
     * @param participantId ID of the participant.
     */
    renderParticipantImage(nameContainer, participantId) {
        const found = this.participantImages.find(item => item.participantId === participantId);
        if (found)
            dom.addParticipantImage(nameContainer, found.imageUrl);
    }
    /**
     * Renders an origin hint for a participant.
     *
     * @param nameContainer The name container.
     * @param participant The participant result.
     * @param originHint Origin hint for the participant.
     * @param matchLocation Location of the match.
     */
    renderHint(nameContainer, participant, originHint, matchLocation) {
        if (originHint === undefined || participant.position === undefined)
            return;
        if (!this.config.showSlotsOrigin)
            return;
        if (!this.config.showLowerBracketSlotsOrigin && matchLocation === 'loser-bracket')
            return;
        dom.setupHint(nameContainer, originHint(participant.position));
    }
    /**
     * Renders a participant's origin.
     *
     * @param nameContainer The name container.
     * @param participant The participant result.
     * @param side Side of the participant.Side of the participant.
     * @param matchLocation Location of the match.
     * @param roundNumber Number of the round.
     */
    renderParticipantOrigin(nameContainer, participant, side, matchLocation, roundNumber) {
        if (participant.position === undefined || matchLocation === undefined)
            return;
        if (!this.config.participantOriginPlacement || this.config.participantOriginPlacement === 'none')
            return;
        if (!this.config.showSlotsOrigin)
            return;
        if (!this.config.showLowerBracketSlotsOrigin && matchLocation === 'loser-bracket')
            return;
        const abbreviation = helpers_1.getOriginAbbreviation(matchLocation, this.skipFirstRound, roundNumber, side);
        if (!abbreviation)
            return;
        const origin = abbreviation + participant.position;
        dom.addParticipantOrigin(nameContainer, origin, this.config.participantOriginPlacement);
    }
    /**
     * Sets mouse hover events for a participant.
     *
     * @param participantId ID of the participant.
     * @param element The dom element to add events to.
     */
    setupMouseHover(participantId, element) {
        if (!this.config.highlightParticipantOnHover)
            return;
        const refs = this.participantRefs[participantId];
        if (!refs)
            throw Error(`The participant (id: ${participantId}) does not exist in the participants table.`);
        refs.push(element);
        // https://flaviocopes.com/how-to-add-event-listener-multiple-elements-javascript/
        // Use bubbling to have only one callback
        element.addEventListener('mouseover', () => {
            refs.forEach(el => el.classList.add('hover'));
        });
        element.addEventListener('mouseleave', () => {
            refs.forEach(el => el.classList.remove('hover'));
        });
    }
}
exports.default = BracketsViewer;
