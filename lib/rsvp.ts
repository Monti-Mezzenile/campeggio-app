export const RSVP_STATUS = {
  PARTECIPO: "partecipo",
  FORSE: "forse",
  NON_POSSO: "non_posso",
} as const;

export type RsvpStatus = (typeof RSVP_STATUS)[keyof typeof RSVP_STATUS];
