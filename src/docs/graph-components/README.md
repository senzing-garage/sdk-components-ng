# Graph Components

Graph components offer a visual representation of search results, or specified entities, and the relationships between or around them.

- `SzStandaloneGraphComponent` is a rollup that contains both a `SzRelationshipNetworkComponent` and a `SzEntityDetailGraphFilterComponent` pre-wired together.
- `SzEntityDetailGraphFilterComponent` is a interface used to alter graph preferences and parameters.
- `SzRelationshipNetworkComponent` is just the core relationship graph functionality. There are no ease-of-use or convenience considerations made here. Use this component if you need a non-skinned, no-fluff embeddable relationship graph.
- `SzRelationshipPathComponent` is for when you already have two or more entities that you want to find any relationships/nodes bewteen. <i>(available in 2.2.0)</i>