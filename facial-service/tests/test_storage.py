import tempfile
import unittest
from pathlib import Path

import numpy as np
from cryptography.fernet import Fernet

from app.storage import EncryptedTemplateStore


class EncryptedTemplateStoreTest(unittest.TestCase):
    def test_round_trip_is_encrypted_and_deletable(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = EncryptedTemplateStore(Path(directory), Fernet.generate_key().decode("ascii"))
            embedding = np.asarray([0.1, 0.2, 0.3], dtype=np.float32)

            store.save("user-7", embedding, "test-model")

            raw = (Path(directory) / "user-7.face").read_bytes()
            self.assertNotIn(b"embedding", raw)
            self.assertTrue(store.exists("user-7"))
            self.assertAlmostEqual(float(np.linalg.norm(store.load("user-7"))), 1.0, places=5)
            self.assertTrue(store.delete("user-7"))
            self.assertFalse(store.exists("user-7"))


if __name__ == "__main__":
    unittest.main()
