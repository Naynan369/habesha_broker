import type { FormikProps } from "formik";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import * as yup from "yup";

export const MAX_PHOTOS = 10;
const MAX_PHOTO_SIZE = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const PHOTO_ACCEPT = [...ALLOWED_PHOTO_TYPES].join(",");

type PhotoMessages = {
	required: string;
	tooMany: string;
	tooLarge: string;
	wrongType: string;
};

type PhotoForm = Pick<FormikProps<{ files: File[] }>, "values" | "setFieldValue" | "setFieldError" | "setFieldTouched">;

export function photoSchema(messages: PhotoMessages) {
	return yup.array().of(yup.mixed()).min(1, messages.required).max(MAX_PHOTOS, messages.tooMany)
		.test("photo-size", messages.tooLarge, (files: File[] | undefined) => !files || files.every((file) => file.size <= MAX_PHOTO_SIZE))
		.test("photo-type", messages.wrongType, (files: File[] | undefined) => !files || files.every((file) => ALLOWED_PHOTO_TYPES.has(file.type)));
}

export function useListingPhotos(messages: PhotoMessages) {
	const [previews, setPreviews] = useState<string[]>([]);
	const previewsRef = useRef(previews);
	const photoInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => { previewsRef.current = previews; }, [previews]);
	useEffect(() => () => previewsRef.current.forEach(URL.revokeObjectURL), []);

	const choosePhotos = (event: ChangeEvent<HTMLInputElement>, formik: PhotoForm) => {
		const files = Array.from(event.currentTarget.files || []);
		if (!files.length) return;
		const validationError = files.length > MAX_PHOTOS ? messages.tooMany
			: files.some((file) => file.size > MAX_PHOTO_SIZE) ? messages.tooLarge
			: files.some((file) => !ALLOWED_PHOTO_TYPES.has(file.type)) ? messages.wrongType
			: null;
		if (validationError) {
			event.currentTarget.value = "";
			formik.setFieldError("files", validationError);
			void formik.setFieldTouched("files", true, false);
			return;
		}
		previews.forEach(URL.revokeObjectURL);
		const nextPreviews = files.map((file) => URL.createObjectURL(file));
		previewsRef.current = nextPreviews;
		setPreviews(nextPreviews);
		void formik.setFieldValue("files", files);
		void formik.setFieldTouched("files", true, false);
	};

	const removePhoto = (index: number, formik: PhotoForm) => {
		const nextFiles = formik.values.files.filter((_, fileIndex) => fileIndex !== index);
		if (previews[index]) URL.revokeObjectURL(previews[index]);
		const nextPreviews = previews.filter((_, previewIndex) => previewIndex !== index);
		previewsRef.current = nextPreviews;
		setPreviews(nextPreviews);
		if (photoInputRef.current) photoInputRef.current.value = "";
		void formik.setFieldValue("files", nextFiles);
		void formik.setFieldTouched("files", true, false);
	};

	return { previews, photoInputRef, choosePhotos, removePhoto };
}
