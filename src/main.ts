import './style.scss';
import { Participant, Match, MatchResults, ParticipantResult, ViewerData } from "brackets-model";
import { splitBy, getRanking, rankingHeader } from "./helpers";

type ConnectionType = 'square' | 'straight' | false;
type Placement = 'none' | 'before' | 'after';

interface Connection {
    connectPrevious?: ConnectionType,
    connectNext?: ConnectionType,
}

interface Config {
    /**
     * Where the position of a participant is placed relative to its name.
     * - If `before`, the position is prepended before the team name. "#1 Team"
     * - If `after`, the position is appended after the team name, in parentheses. "Team (#1)"
     */
    participantOriginPlacement: Placement,

    /**
     * Whether to show the origin of a slot (wherever possible).
     */
    showSlotsOrigin: boolean,

    /**
     * Whether to show the origin of a slot (in the lower bracket of an elimination stage).
     */
    showLowerBracketSlotsOrigin: boolean,
}

class BracketsViewer {

    readonly teamRefsDOM: { [key: number]: HTMLElement[] } = {};
    private participants!: Participant[];
    private config!: Config;

    public render(rootSelector: string, data: ViewerData, config?: Config) {
        const root = $(rootSelector);

        if (root.length === 0) {
            throw Error('Root not found. You must have a root element with id "root"')
        }

        this.config = {
            participantOriginPlacement: config && config.participantOriginPlacement || 'before',
            showSlotsOrigin: config && config.showSlotsOrigin || true,
            showLowerBracketSlotsOrigin: config && config.showLowerBracketSlotsOrigin || false,
        };

        switch (data.stage.type) {
            case 'round_robin':
                this.renderRoundRobin(root, data);
                break;
            case 'single_elimination':
            case 'double_elimination':
                this.renderElimination(root, data);
                break;
            default:
                throw Error(`Unknown bracket type: ${data.stage.type}`);
        }
    }

    private renderRoundRobin(root: JQuery, data: ViewerData) {
        data.participants.map(participant => this.teamRefsDOM[participant.id] = []);

        this.participants = data.participants;

        const container = $('<div class="round-robin">');
        let groupNumber = 1;

        for (const group of splitBy(data.matches, 'group_id')) {
            const groupDOM = $('<section class="group">').append($('<h2>').text(`Group ${groupNumber++}`));;
            let roundNumber = 1;

            for (const round of splitBy(group, 'round_id')) {
                const roundDOM = $('<article class="round">').append($('<h3>').text(`Round ${roundNumber}`));

                for (const match of round) {
                    roundDOM.append(this.renderMatch(match));
                }

                groupDOM.append(roundDOM);
                roundNumber++;
            }

            groupDOM.append(this.renderTable(group));
            container.append(groupDOM);
        }

        root.append($('<h1>').text(data.stage.name));
        root.append(container);
    }

    private renderTable(matches: Match[]) {
        const rankings = getRanking(matches);
        const table = $('<table>');
        const headers = $('<tr>');

        for (const prop in rankings[0]) {
            const header = rankingHeader(prop as any);
            headers.append($('<th>').text(header.value).attr('title', header.tooltip));
        }

        table.append(headers);

        for (const ranking of rankings) {
            const row = $('<tr>');

            for (const prop in ranking) {
                let data: number | string = ranking[prop];

                if (prop === 'id') {
                    const participant = this.participants.find(team => team.id === data);

                    if (participant !== undefined) {
                        const cell = $('<td>').text(participant.name);
                        const id = participant.id;

                        this.teamRefsDOM[id].push(cell.get(0));
                        cell.hover(
                            () => $(this.teamRefsDOM[id]).addClass('hover'),
                            () => $(this.teamRefsDOM[id]).removeClass('hover'),
                        );

                        row.append(cell);
                        continue;
                    }
                }

                row.append($('<td>').text(data));
            }

            table.append(row);
        }

        return table;
    }

    private renderElimination(root: JQuery, data: ViewerData) {
        data.participants.map(participant => this.teamRefsDOM[participant.id] = []);

        const matchesByGroup = splitBy(data.matches, 'group_id');
        this.participants = data.participants;

        root.append($('<h1>').text(data.stage.name));

        if (data.stage.type === 'single_elimination') {
            const hasFinal = !!matchesByGroup[1];
            this.renderBracket(root, splitBy(matchesByGroup[0], "round_id"), number => `Round ${number}`);

            if (hasFinal) {
                this.renderFinal('consolation_final', matchesByGroup[1]);
            }
        } else if (data.stage.type === 'double_elimination') {
            const hasFinal = !!matchesByGroup[2];
            this.renderBracket(root, splitBy(matchesByGroup[0], "round_id"), number => `WB Round ${number}`, false, hasFinal);
            this.renderBracket(root, splitBy(matchesByGroup[1], "round_id"), number => `LB Round ${number}`, true);

            if (hasFinal) {
                this.renderFinal('grand_final', matchesByGroup[2]);
            }
        }
    }

    /**
     * Renders a bracket.
     */
    private renderBracket(root: JQuery, matchesByRound: Match[][], roundName: (roundNumber: number) => string, lowerBracket?: boolean, connectFinal?: boolean) {
        const bracket = $('<section class="bracket">');

        let roundNumber = 1;

        for (const matches of matchesByRound) {
            const roundDOM = $('<article class="round">').append($('<h3>').text(roundName(roundNumber)));

            for (const match of matches) {
                let connection: Connection;

                if (lowerBracket) {
                    connection = {
                        connectPrevious: roundNumber > 1 && (roundNumber % 2 === 1 ? 'square' : 'straight'),
                        connectNext: roundNumber < matchesByRound.length && (roundNumber % 2 === 0 ? 'square' : 'straight'),
                    };
                } else {
                    connection = {
                        connectPrevious: roundNumber > 1 && 'square',
                        connectNext: roundNumber < matchesByRound.length ? 'square' : (connectFinal ? 'straight' : false),
                    };
                }

                roundDOM.append(this.renderMatch(match, connection, `M ${roundNumber}.${match.number}`, lowerBracket));
            }

            bracket.append(roundDOM);
            roundNumber++;
        }

        root.append(bracket);
    }

    private renderFinal(type: 'consolation_final' | 'grand_final', matches: Match[]) {
        const upperBracket = $('.bracket').eq(0);
        const grandFinalName = matches.length === 1 ? () => 'Grand Final' : (i: number) => `Grand Final R${i + 1}`;

        for (let i = 0; i < matches.length; i++) {
            const matchDOM = this.renderMatch(matches[i], {
                connectPrevious: type === 'grand_final' && (i === 0 && 'straight'),
                connectNext: matches.length === 2 && i === 0 && 'straight',
            });

            const roundDOM = $('<article class="round">').append($('<h3>').text(type === 'grand_final' ? grandFinalName(i) : 'Consolation Final'));
            roundDOM.append(matchDOM);

            upperBracket.append(roundDOM);
        }
    }

    private renderMatch(results: MatchResults, connection?: Connection, label?: string, lowerBracket?: boolean) {
        const team1 = this.renderTeam(results.opponent1, lowerBracket || false);
        const team2 = this.renderTeam(results.opponent2, lowerBracket || false);

        const teams = $('<div class="teams">');
        if (label) teams.append($('<span>').text(label));
        teams.append(team1).append(team2);

        const match = $('<div class="match">').append(teams);
        if (!connection) return match;

        if (connection.connectPrevious)
            teams.addClass('connect-previous');

        if (connection.connectNext)
            match.addClass('connect-next');

        if (connection.connectPrevious === 'straight')
            teams.addClass('straight');

        if (connection.connectNext === 'straight')
            match.addClass('straight');

        return match;
    }

    private renderTeam(team: ParticipantResult | null, lowerBracket: boolean) {
        const teamDOM = $(`<div class="team">`);
        const nameDOM = $('<div class="name">');
        const resultDOM = $('<div class="result">');

        if (team === null) {
            nameDOM.text('BYE');
        } else {
            const participant = this.participants.find(participant => participant.id === team.id);

            if (participant) {
                nameDOM.text(participant.name);
                this.renderTeamOrigin(nameDOM, team, lowerBracket);
            }

            resultDOM.text(team.score === undefined ? '-' : team.score);

            if (team.result && team.result === 'win') {
                nameDOM.addClass('win');
                resultDOM.addClass('win');

                if (team.score === undefined)
                    resultDOM.text('W'); // Win.
            }

            if (team.result && team.result === 'loss' || team.forfeit) {
                nameDOM.addClass('loss');
                resultDOM.addClass('loss');

                if (team.forfeit)
                    resultDOM.text('F'); // Forfeit.
                else if (team.score === undefined)
                    resultDOM.text('L'); // Loss.
            }
        }

        teamDOM.append(nameDOM).append(resultDOM);

        if (team && team.id !== null) {
            const id = team.id;
            this.teamRefsDOM[id].push(teamDOM.get(0));
            teamDOM.hover(
                () => $(this.teamRefsDOM[id]).addClass('hover'),
                () => $(this.teamRefsDOM[id]).removeClass('hover'),
            );
        }

        return teamDOM;
    }

    private renderTeamOrigin(name: JQuery, team: ParticipantResult, lowerBracket: boolean) {
        if (team.position === undefined) return;
        if (this.config.participantOriginPlacement === 'none') return;
        if (!this.config.showSlotsOrigin) return;
        if (!this.config.showLowerBracketSlotsOrigin && lowerBracket) return;

        // 'P' for position (where the participant comes from) and '#' for actual seeding.
        const text = lowerBracket ? `P${team.position}` : `#${team.position}`;

        this.addTeamOrigin(name, text, this.config.participantOriginPlacement);
    }

    private addTeamOrigin(name: JQuery, text: string, placement: Placement) {
        if (placement === 'before')
            name.prepend($('<span>').text(`${text} `));
        else
            name.append($('<span>').text(` (${text})`));
    }
}

(window as any).bracketsViewer = new BracketsViewer();