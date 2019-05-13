import { database } from "firebase-admin";

export function convertSnapshotToArray(snapshot: database.DataSnapshot) {
    const val = snapshot.val();
    const ids = Object.keys(snapshot.val());
    const snapArray = ids.map(id => {
        return Object.assign({}, val[id], { id });
    });
    return snapArray;
}
