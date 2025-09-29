package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// --- UP (create collection) ---
		collection := core.NewBaseCollection("events")

		collection.Fields.Add(
			// title
			&core.TextField{
				Name:     "title",
				Required: true,
				Max:      255,
			},
			// start / end datetimes
			&core.DateField{
				Name:     "start",
				Required: true,
			},
			&core.DateField{
				Name:     "end",
				Required: true,
			},
			// allDay
			&core.BoolField{
				Name: "allDay",
			},
			// category enum
			&core.SelectField{
				Name:   "category",
				Values: []string{"College", "Personal", "Other"},
			},
			// color (hex or tailwind token)
			&core.TextField{
				Name: "color",
				Max:  50,
			},
			// tags as a string array
			&core.JSONField{
				Name: "tags",
			},
			// location & notes
			&core.TextField{
				Name: "location",
				Max:  255,
			},
			&core.TextField{
				Name: "notes",
				Max:  1000,
			},
			// reminderMinutes as number array
			&core.JSONField{
				Name: "reminderMinutes",
			},
			// rrule string
			&core.TextField{
				Name: "rrule",
				Max:  500,
			},
			// exdates array of ISO strings
			&core.JSONField{
				Name: "exdates",
			},
			// parentId (self-relation for recurring series)
			// &core.RelationField{
			// 	Name:         "parentId",
			// 	CollectionId: "", // self relation
			// },
			// sourceId for detached occurrences
			// &core.RelationField{
			// 	Name:         "sourceId",
			// 	CollectionId: "", // self relation
			// },
		)

		return app.Save(collection)
	}, func(app core.App) error {
		// --- DOWN (drop collection) ---
		coll, err := app.FindCollectionByNameOrId("events")
		if err != nil {
			return err
		}
		return app.Delete(coll)
	})
}
