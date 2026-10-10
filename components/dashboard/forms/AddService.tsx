import {
	Button,
	CircularProgress,
	CircularProgressLabel,
	FormControl,
	FormErrorMessage,
	FormLabel,
	Grid,
	Image,
	Modal,
	ModalBody,
	ModalContent,
	ModalOverlay,
	Select,
	SimpleGrid,
	Text,
	Textarea,
	useToast,
} from "@chakra-ui/react";
import { InputField } from "@components/dashboard/forms/InputField";
import { useLang } from "@libs/hooks/useLang";
import axios from "axios";
import { Formik } from "formik";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { MdSave } from "react-icons/md";
import * as yup from "yup";

const categoryValues = ["BROKER_SUPPORT", "PROPERTY_PHOTOGRAPHY", "MOVING", "CLEANING", "REPAIRS", "PROPERTY_MANAGEMENT"];

export const AddService = () => {
	const router = useRouter();
	const toast = useToast();
	const lang = useLang();
	const text = lang.serviceListing;
	const common = lang.businessListing;
	const [uploadProgress, setUploadProgress] = useState(0);
	const [previews, setPreviews] = useState<string[]>([]);

	useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview)), [previews]);

	const schema = useMemo(() => yup.object().shape({
		title: yup.string().trim().min(5).max(300).required(),
		category: yup.string().oneOf(categoryValues).required(),
		price: yup.number().min(0).required(),
		priceType: yup.string().oneOf(["FIXED", "NEGOTIABLE"]).required(),
		region: yup.string().trim().max(100).required(),
		city: yup.string().trim().max(100).required(),
		serviceArea: yup.string().max(240),
		files: yup.array().min(1, common.photosRequired),
	}), [common.photosRequired]);

	const initialValues = {
		title: "",
		category: "BROKER_SUPPORT",
		price: 0,
		priceType: "NEGOTIABLE",
		itemType: "SERVICE",
		region: "",
		city: "",
		serviceArea: "",
		description: "",
		files: [],
	};

	const onSubmit = async (values, actions) => {
		const formData = new FormData();
		const { files, ...fields } = values;
		Object.entries(fields).forEach(([key, value]) => formData.append(key, String(value)));
		files.forEach((file) => formData.append("files", file));

		try {
			const response = await axios.post("/api/items/add", formData, {
				headers: { "Content-Type": "multipart/form-data" },
				onUploadProgress: (event) => {
					if (event.total) setUploadProgress((event.loaded * 100) / event.total);
				},
			});
			toast({ title: common.successTitle, status: "success", description: response.data.msg, isClosable: true });
			await router.push("/dashboard");
		} catch (error: any) {
			toast({ title: common.errorTitle, status: "error", description: error?.response?.data?.err || error?.message || common.submitError, isClosable: true });
		} finally {
			actions.setSubmitting(false);
		}
	};

	return (
		<Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={schema} validateOnBlur>
			{(formik) => {
				return (
					<form onSubmit={formik.handleSubmit}>
						<Modal isOpen={formik.isSubmitting} closeOnOverlayClick={false} closeOnEsc={false} onClose={() => {}}>
							<ModalOverlay />
							<ModalContent p="10"><ModalBody display="flex" flexDirection="column" alignItems="center" justifyContent="center">
								<CircularProgress size="150px" value={uploadProgress}><CircularProgressLabel>{Math.round(uploadProgress)}%</CircularProgressLabel></CircularProgress>
								<Text mt="4" fontWeight="bold">{common.uploading}</Text>
							</ModalBody></ModalContent>
						</Modal>

						<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5" mb="5">
							<InputField formik={formik} label={common.title} name="title" />
							<FormControl isRequired isInvalid={Boolean(formik.touched.category && formik.errors.category)}>
								<FormLabel>{text.category}</FormLabel>
								<Select name="category" value={formik.values.category} onChange={formik.handleChange} variant="filled">
									{categoryValues.map((category) => <option value={category} key={category}>{text.categories[category]}</option>)}
								</Select>
								<FormErrorMessage>{formik.errors.category as string}</FormErrorMessage>
							</FormControl>
						</SimpleGrid>

						<SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} spacing="5" mb="5">
							<FormControl><FormLabel>{common.priceType}</FormLabel><Select name="priceType" value={formik.values.priceType} onChange={formik.handleChange} variant="filled">
								<option value="FIXED">{common.fixed}</option><option value="NEGOTIABLE">{common.negotiable}</option>
							</Select></FormControl>
							<InputField formik={formik} label={common.price} name="price" type="number" suffix={<Text>ETB</Text>} />
							<InputField formik={formik} label={text.region} name="region" />
							<InputField formik={formik} label={text.city} name="city" />
							<InputField formik={formik} label={text.serviceArea} name="serviceArea" />
						</SimpleGrid>
						<Text mt="-3" mb="5" color="gray.500" fontSize="sm">{text.serviceAreaHint}</Text>

						<FormControl mb="5"><FormLabel>{text.description}</FormLabel><Textarea name="description" value={formik.values.description} onChange={formik.handleChange} variant="filled" maxLength={10000} /></FormControl>
						<FormControl isInvalid={Boolean(formik.touched.files && formik.errors.files)}>
							<FormLabel>{common.photos}</FormLabel>
							<input type="file" name="files" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => { const files = Array.from(event.currentTarget.files || []); setPreviews(files.map((file) => URL.createObjectURL(file))); formik.setFieldValue("files", files); }} />
							<FormErrorMessage>{formik.errors.files as string}</FormErrorMessage>
						</FormControl>
						<Grid gridTemplateColumns="repeat(auto-fit, 160px)" gap="4" my="4">
							{previews.map((src, index) => <Image alt={`${common.photoPreview} ${index + 1}`} key={`service-photo-${index}`} borderRadius="lg" width="160px" height="160px" objectFit="cover" src={src} />)}
						</Grid>
						<Button type="submit" colorScheme="orange" leftIcon={<MdSave />} isLoading={formik.isSubmitting} isDisabled={!formik.isValid}>{common.submit}</Button>
					</form>
				);
			}}
		</Formik>
	);
};
