# Neutrality: what the patterns do and do not prescribe

Adopted 2026-11-24 at the owner's direction, after a review found products and designs on the
drawings presented as the answer where an organisation really chooses. These rules apply to every
pattern, platform mapping, pack and settings row, and to the skills that author them.

The site describes what a kind of AI system is made of, how data moves through it and which
controls it needs. It must not force a technology or a design where an organisation has real
choices. In the owner's words: give examples and recommendations, not mandates.

## What stays firm
- **The roles and the data flows.** A pattern's boxes are roles (an AI gateway, model storage,
  an identity provider) and its arrows are flows that happen whatever the mechanism. Weights
  come in from a public hub whether by a direct pull or a download carried across; the
  connector stays.
- **Control outcomes.** What must be true ("weights are verified against the approved copy
  before they load"), not how to make it true.
- **Facts about a named platform**, sourced from its own pages: AWS, Azure and Google Cloud boxes
  name the provider's own services, because choosing that cloud is choosing them.

## What to avoid
1. **One product named as the implementation where the organisation chooses.** On-premises
   (and anywhere a cloud offers several native options or a pattern is product-neutral), a box
   names the role, with examples and a recommendation in hover help, not "LiteLLM Proxy on
   Kubernetes" as if it were the answer.
2. **Our pick presented as the default.** "This mapping builds it with vLLM" on-premises is our
   choice, not a vendor's guidance; say "for example".
3. **A design choice written as a hard rule.** "The serving network has no route to the Hub";
   "an intake job pulls the weights"; "default-deny network policy". Where several designs meet
   the control, state the outcome, list the common ways, and recommend one only with a reason.
4. **Connectors removed or redirected to suit a preferred design.** Flows that happen in any
   design stay drawn; how they are carried is a note on the arrow, not a different drawing.
5. **Notes about our chosen product shown as facts about the pattern or platform.** "LiteLLM
   Enterprise is needed for SSO", "vLLM's key covers only some paths": true for that product, so
   they belong with that product as an example, not marked on the drawing.
6. **Control steps that prescribe one mechanism or product** ("run the shell in gVisor"), where
   the outcome ("the shell cannot reach the host or the network") can be met several ways.
7. **Unstated environment assumptions** made universal: everything on Kubernetes, one shared
   multi-tenant cluster, a particular CI system, a particular identity provider.
8. **Settings of one chosen product presented as the platform's settings.** On-premises, a
   setting belongs to a product the organisation might not run; show it as "if you use X".
9. **Vendor defaults or behaviours generalised** beyond the product that has them.
10. **Lessons from one incident turned into universal rules** beyond what the incident shows.

## Where things belong instead
- A setting that makes the drawing true: a row on Enable under its control, with the default
  stating the gap.
- A product limit, edition requirement or quirk: with that product (its settings' "requires",
  its component note), and on-premises as an example among others.
- A real difference in shape on a named cloud (an extra hop, a service outside your network):
  that platform's drawing.
- Best practice everywhere: the control's "do", worded as an outcome with options.

## How the site carries this
- **Roles and options.** On-premises a box names its role; `options` list the products that play
  it (open source and commercial), and `packs` group products their vendors document as working
  together. On a named cloud the provider's service stays in the box, with options where the cloud
  offers several ways. Choosing a pack on Enable (`?stack=`, `?addons=`) puts its products in the
  boxes and narrows the settings.
- **Settings that belong to one product** carry `product:` and read "If you use ...".
- **Real differences in shape** are `shape:` changes the drawing applies for that platform.
- **Product limits** are `watch` notes on the product. Nothing is marked on the drawing to mean
  "careful here".
