import { Publisher } from "../../domain";
import { PublisherDetail, PublisherSummary } from "../dtos";

export function toPublisherSummary(publisher: Publisher): PublisherSummary {
  const snapshot = publisher.snapshot();

  return {
    id: snapshot.id.value(),
    officialName: snapshot.officialName,
    acronym: snapshot.acronym,
    country: snapshot.country,
  };
}

export function toPublisherDetail(publisher: Publisher): PublisherDetail {
  const snapshot = publisher.snapshot();
  const universitySnapshot = snapshot.university.snapshot();

  return {
    ...toPublisherSummary(publisher),
    university: {
      id: universitySnapshot.id.value(),
      officialName: universitySnapshot.officialName,
      acronym: universitySnapshot.acronym,
      province: universitySnapshot.province,
      country: universitySnapshot.country,
      website: universitySnapshot.website,
    },
    publisherCode: snapshot.publisherCode,
    description: snapshot.description,
    province: snapshot.province,
    website: snapshot.website,
    logo: snapshot.logo,
    contactPoint: snapshot.contactPoint,
  };
}
