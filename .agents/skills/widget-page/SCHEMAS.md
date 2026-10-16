# Widget-config schemas (embedded output)

Each page embeds `<script type="application/json" id="widget-config">`. All
types MAY additionally carry a shared optional `sources` array when the
scene was built from research-grounded claims — passed through from
`course-generate`, same shape as the `.sources` footer in `VISUAL-STYLE.md`:
`"sources":[{"title":"...","publisher":"...","date":"...","url":"..."}]`.
Omit the key entirely when the scene has no sourced claims.

```json
// simulation
{"type":"simulation","concept":"...","description":"...","variables":[{"name":"angle","label":"...","min":0,"max":90,"default":45,"unit":"°"}],"presets":[{"name":"...","variables":{}}]}
// diagram
{"nodes":[{"id":"n1","label":"...","icon":"...","details":"..."}],"edges":[{"from":"n1","to":"n2","label":"..."}],"revealOrder":["n1","n2"]}
// code
{"type":"code","language":"python","description":"...","starterCode":"...","testCases":[{"id":"t1","input":"5","expected":"25","description":"..."}],"hints":["..."],"solution":"..."}
// game
{"type":"game","gameType":"action","description":"...","gameConfig":{"controls":[],"targets":[],"initialConditions":{},"successCondition":"..."},"scoring":{},"achievements":[]}
// visualization3d
{"type":"visualization3d","visualizationType":"solar","description":"...","objects":[],"interactions":[],"presets":[]}
// procedural-skill (type must be exact)
{"type":"procedural-skill","task":"...","description":"...","tools":["..."],"steps":[{"id":"step-1","title":"...","description":"...","tools":[],"successCriteria":[]}],"successCriteria":["..."],"errorConsequences":["..."]}
```
