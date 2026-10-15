# A scene id names one simulation within its subject, not on its own

The tool numbers each course's scenes from `s1`, so `s1` names one scene of one course and nothing more. Two courses therefore both have an `s1`, and nothing in the id says which.

Both halves of that matter. Checking the subject at the point of comparison stops IPA's `s15` being read as a correction of Matematika's `s15`. Keying the lookup by subject as well as scene id stops the two from evicting each other: a table keyed by scene id alone holds one `s2`, so whichever subject was written second would be republished on every run and collide with its own slug.

The publish pipeline matched a scene to a published simulation on that id alone. Publishing the IPA course against a catalog holding only Matematika matched IPA's `s15` to Matematika's `s15`, and the batch reported 23 corrections rather than 48 additions. Written out, that would have copied 23 IPA files under Matematika slugs, and the Matematika pages would have served IPA content.

A scene is now only the same simulation when its subject matches as well. A scene id still identifies a simulation within its subject, which is what the correction rule needs (ADR 0007): the tool rewrites a scene's title when it fixes the simulation, so matching on the title would mint a new slug and strand the address search results already point at. Two courses of the *same* subject would still collide on their scene ids, so uniqueness is checked per subject.

A slug is the other half of the identity and stays unique across everything, because no URL carries a subject. Two subjects whose scenes reduce to the same slug are refused rather than published over one another.