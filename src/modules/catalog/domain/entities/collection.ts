import { normalizeOptionalText, requireNonEmptyText } from "./domain-guards";
import { PnpuUuid } from "../value-objects";
import { Publisher } from "./publisher";
import { Subject } from "./subject";

export interface CollectionProps {
  readonly id: PnpuUuid;
  readonly title: string;
  readonly publisher: Publisher;
  readonly description?: string;
  readonly collectionCode?: string;
  readonly editorialSeries?: string;
  readonly subjects?: readonly Subject[];
}

export class Collection {
  private constructor(private readonly props: CollectionProps) {}

  public static create(props: CollectionProps): Collection {
    return new Collection({
      id: props.id,
      title: requireNonEmptyText(props.title, "Collection title"),
      publisher: props.publisher,
      description: normalizeOptionalText(props.description),
      collectionCode: normalizeOptionalText(props.collectionCode),
      editorialSeries: normalizeOptionalText(props.editorialSeries),
      subjects: props.subjects === undefined ? undefined : [...props.subjects],
    });
  }

  public id(): PnpuUuid {
    return this.props.id;
  }

  public title(): string {
    return this.props.title;
  }

  public publisher(): Publisher {
    return this.props.publisher;
  }

  public snapshot(): CollectionProps {
    return {
      ...this.props,
      subjects: this.props.subjects === undefined ? undefined : [...this.props.subjects],
    };
  }
}
