export interface ISymEvent {
  run: ISymEventRun;
  fields: ISymEventFields;
  event: ISymEventDetails;
}

interface ISymEventRun {
  actors: ISymEventRunActors;
}

interface ISymEventRunActors {
  request: ISymActor;
}

interface ISymActor {
  username: string;
}

interface ISymEventFields {
  "tenant-id": string;
}

interface ISymEventDetails {
  type: string;
}
