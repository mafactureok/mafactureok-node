import type { components } from "./generated/openapi.js";

type Schemas = components["schemas"];

/** The validation report, pre-digested in plain French (contract v1, frozen). */
export type ValiderFactureDigest = Schemas["ValiderFactureDigest"];
export type Verdict = ValiderFactureDigest["verdict"];
export type Anomalie = ValiderFactureDigest["anomalies"][number];
export type Point = ValiderFactureDigest["points"][number];
export type Entreprise = NonNullable<ValiderFactureDigest["entreprises"]>[number];
export type Referentiel = ValiderFactureDigest["referentiels"][number];

export type VerifierTiersReponse = Schemas["VerifierTiersReponse"];
export type VerifierTiersResultat = Schemas["VerifierTiersResultat"];
export type Moi = Schemas["Moi"];
export type ErreurApi = Schemas["Erreur"];

/** What the key may still do today, from the `x-quota-*` headers of a keyed call. */
export interface Quota {
  limite: number;
  restant: number;
}

/** A validation report plus the quota left on the key after this call. */
export type RapportValidation = ValiderFactureDigest & { quota?: Quota };

/** Anything that holds the bytes of one invoice file. `{ chemin }` reads a file from disk. */
export type FichierFacture = Uint8Array | ArrayBuffer | Blob | { chemin: string };
