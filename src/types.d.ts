import { TournamentType, OrderingType, Teams, TournamentResults } from "brackets-model/dist/types";

export interface TournamentData {
    name: string,
    type: TournamentType,
    minorOrdering: OrderingType[],
    teams: Teams,
    results: TournamentResults,
}

export interface Connection {
    connectPrevious: boolean,
    connectNext: boolean,
}