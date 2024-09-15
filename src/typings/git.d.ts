import * as vscode from 'vscode';

export interface GitExtension {
    readonly enabled: boolean;
    readonly repositories: Repository[];
    getAPI(version: number): API;
}

export interface API {
    readonly repositories: Repository[];
    // Add other members of the API as needed
}

export interface Repository {
    readonly rootUri: vscode.Uri;
    readonly inputBox: InputBox;
    // Add other members of the Repository as needed
}

export interface InputBox {
    value: string;
}