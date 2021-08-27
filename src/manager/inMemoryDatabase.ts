import { CrudInterface, OmitId, Table } from 'brackets-manager';
import { Database } from 'brackets-manager/dist/types';

export class InMemoryDatabase implements CrudInterface {
    protected data: Database = {
        participant: [],
        stage: [],
        group: [],
        round: [],
        match: [],
        match_game: [],
    };

    /**
     * @param data "import" data from external
     */
    setData(data: Database): void {
        this.data = data;
    }

    makeFilter(partial: any): (entry: any) => boolean {
        return (entry: any): boolean => {
            let result = true;
            for (const [key, value] of Object.entries(partial)) {
                result = result && entry[key] === value;
            }
            return result;
        };
    }

    /**
     * Clearing all of the data
     */
    reset() {
        this.data = {
            participant: [],
            stage: [],
            group: [],
            round: [],
            match: [],
            match_game: [],
        };
    }

    insert<T>(table: Table, value: OmitId<T>): Promise<number>;
    /**
     * Inserts multiple values in the database.
     *
     * @param table Where to insert.
     * @param values What to insert.
     */
    insert<T>(table: Table, values: OmitId<T>[]): Promise<boolean>;

    /**
     * Implementation of insert
     *
     * @param table Where to insert.
     * @param values What to insert.
     */
    insert<T>(table: Table, values: OmitId<T> | OmitId<T>[]): Promise<number> | Promise<boolean> {
        let id: number;
        id = this.data[table].length;

        if (!Array.isArray(values)) {
            try {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                this.data[table].push({ id, ...values });
            } catch (error) {
                return new Promise<number>((resolve) => {
                    resolve(-1);
                });
            }
            return new Promise<number>((resolve) => {
                resolve(id);
            });
        }

        try {
            values.map(object => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                this.data[table].push({ id: id++, ...object });
            });
        } catch (error) {
            return new Promise<boolean>((resolve) => {
                resolve(false);
            });
        }

        return new Promise<boolean>((resolve) => {
            resolve(true);
        });
    }

    /**
     * Gets all data from a table in the database.
     *
     * @param table Where to get from.
     */
    select<T>(table: Table): Promise<T[] | null>;
    /**
     * Gets specific data from a table in the database.
     *
     * @param table Where to get from.
     * @param id What to get.
     */
    select<T>(table: Table, id: number): Promise<T | null>;
    /**
     * Gets data from a table in the database with a filter.
     *
     * @param table Where to get from.
     * @param filter An object to filter data.
     */
    select<T>(table: Table, filter: Partial<T>): Promise<T[] | null>;

    /**
     * @param table Where to get from.
     * @param arg
     */
    select<T>(table: Table, arg?: number | Partial<T>): Promise<T[] | null> {
        try {
            if (arg === undefined) {
                return new Promise<T[]>((resolve) => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    resolve(this.data[table]);
                });
            }

            if (typeof arg === 'number') {
                return new Promise<T[]>((resolve) => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    resolve(this.data[table][arg]);
                });
            }

            return new Promise<T[] | null>((resolve) => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                resolve(this.data[table].filter(this.makeFilter(arg)) || null);
            });
        } catch (error) {
            return new Promise<null>((resolve) => {
                resolve(null);
            });
        }
    }

    /**
     * Updates data in a table.
     *
     * @param table Where to update.
     * @param id What to update.
     * @param value How to update.
     */

    update<T>(table: Table, id: number, value: T): Promise<boolean>;
    /**
     * Updates data in a table.
     *
     * @param table Where to update.
     * @param filter An object to filter data.
     * @param value How to update.
     */
    update<T>(table: Table, filter: Partial<T>, value: Partial<T>): Promise<boolean>;

    /**
     * Updates data in a table.
     *
     * @param table Where to update.
     * @param arg
     * @param value How to update.
     */
    update<T>(table: Table, arg: number | Partial<T>, value?: Partial<T>): Promise<boolean> {
        if (typeof arg === 'number') {
            try {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                this.data[table][arg] = value;
                return new Promise<boolean>((resolve) => {
                    resolve(true);
                });
            } catch (error) {
                return new Promise<boolean>((resolve) => {
                    resolve(false);
                });
            }
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const values = this.data[table].filter(this.makeFilter(arg));
        if (!values) {
            return new Promise<boolean>((resolve) => {
                resolve(false);
            });
        }

        values.forEach((v: { id: any }) => {
            const existing = this.data[table][v.id];
            for (const key in value) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                existing[key] = value[key];
            }
            this.data[table][v.id] = existing;
        });

        return new Promise<boolean>((resolve) => {
            resolve(true);
        });
    }

    /**
     * Empties a table completely.
     *
     * @param table Where to delete everything.
     */
    delete(table: Table): Promise<boolean>;
    /**
     * Delete data in a table, based on a filter.
     *
     * @param table Where to delete in.
     * @param filter An object to filter data.
     */
    delete<T>(table: Table, filter: Partial<T>): Promise<boolean>;

    /**
     * Delete data in a table, based on a filter.
     *
     * @param table Where to delete in.
     * @param filter An object to filter data.
     */
    delete<T>(table: Table, filter?: Partial<T>): Promise<boolean> {
        const values = this.data[table];
        if (!values) {
            return new Promise<boolean>((resolve) => {
                resolve(false);
            });
        }

        const predicate = this.makeFilter(filter);
        const negativeFilter = (value: any): boolean => !predicate(value);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.data[table] = values.filter(negativeFilter);

        return new Promise<boolean>((resolve) => {
            resolve(true);
        });
    }
}
