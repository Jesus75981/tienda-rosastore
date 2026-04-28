export const createCrudController = (Model) => {
  return {
    getAll: async (req, res) => {
      try {
        const docs = await Model.find();
        res.status(200).json(docs);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    },
    getOne: async (req, res) => {
      try {
        const doc = await Model.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'No encontrado' });
        res.status(200).json(doc);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    },
    create: async (req, res) => {
      try {
        const newDoc = new Model(req.body);
        const savedDoc = await newDoc.save();
        res.status(201).json(savedDoc);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },
    update: async (req, res) => {
      try {
        const updatedDoc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedDoc) return res.status(404).json({ message: 'No encontrado' });
        res.status(200).json(updatedDoc);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },
    remove: async (req, res) => {
      try {
        const deletedDoc = await Model.findByIdAndDelete(req.params.id);
        if (!deletedDoc) return res.status(404).json({ message: 'No encontrado' });
        res.status(200).json({ message: 'Eliminado correctamente' });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  };
};
