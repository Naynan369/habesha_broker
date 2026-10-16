import {
	Box,
	Button,
	CircularProgress,
	CircularProgressLabel,
	Flex,
	FormControl,
	FormErrorMessage,
	FormLabel,
	Grid,
	Heading,
	Image,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalOverlay,
	Select,
	SimpleGrid,
	Text,
	Textarea,
	useColorModeValue,
	useToast,
} from "@chakra-ui/react";
import { InputField } from "@components/dashboard/forms/InputField";
import { ListingWizardProgress } from "@components/dashboard/forms/ListingWizardProgress";
import { useLang } from "@libs/hooks/useLang";
import { uploadMediaFiles } from "@libs/helpers/uploadMedia.client";
import axios from "axios";
import { Formik } from "formik";
import { useRouter } from "next/router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { MdArrowBack, MdArrowForward, MdClose, MdSave } from "react-icons/md";
import * as yup from "yup";

const MAX_PHOTOS = 10;
const MAX_PHOTO_SIZE = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const CATEGORIES = ["BROKER_SUPPORT", "PROPERTY_PHOTOGRAPHY", "MOVING", "CLEANING", "REPAIRS", "PROPERTY_MANAGEMENT"];

export const AddService = ({ user }: { user?: { id: string } }) => {
	const router = useRouter();
	const toast = useToast();
	const lang = useLang();
	const text = lang.serviceListing;
	const common = lang.businessListing;
	const uploadButtonBg = useColorModeValue("orange.50", "whiteAlpha.100");
	const uploadButtonText = useColorModeValue("orange.800", "orange.100");
	const muted = useColorModeValue("gray.600", "gray.400");
	const panelBorder = useColorModeValue("gray.200", "whiteAlpha.200");
	const [uploadProgress, setUploadProgress] = useState(0);
	const [previews, setPreviews] = useState<string[]>([]);
	const [step, setStep] = useState(0);
	const previewsRef = useRef(previews);
	useEffect(() => { previewsRef.current = previews; }, [previews]);
	useEffect(() => () => previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview)), []);

	const schema = yup.object().shape({
		title: yup.string().trim().min(5, "Use at least 5 characters").max(300, "Keep the title under 300 characters").required("A listing title is required"),
		category: yup.string().oneOf(CATEGORIES).required("Choose a service category"),
		price: yup.number().typeError("Enter a valid price").min(0, "Price cannot be negative").required("A price is required"),
		priceType: yup.string().oneOf(["FIXED", "NEGOTIABLE"]).required("Choose a price type"),
		region: yup.string().trim().max(100).required("Region is required"),
		city: yup.string().trim().max(100).required("City is required"),
		serviceArea: yup.string().max(240),
		description: yup.string().max(10000, "Keep the description under 10,000 characters"),
		files: yup.array().of(yup.mixed()).min(1, common.photosRequired).max(MAX_PHOTOS, common.wizard.maxPhotos)
			.test("photo-size", common.photoSizeError, (files: File[]) => !files || files.every((file) => file.size <= MAX_PHOTO_SIZE))
			.test("photo-type", common.photoTypeError, (files: File[]) => !files || files.every((file) => ALLOWED_PHOTO_TYPES.includes(file.type))),
	});

	const steps = common.wizard.steps as string[];
	const hints = common.wizard.hints as string[];
	const fieldsByStep = [
		["title", "category", "price", "priceType"],
		["serviceArea", "description"],
		["region", "city"],
		["files"],
	];

	const onSubmit = async (values: any, actions: any) => {
		try {
			if (!user?.id) throw new Error("Please sign in again before uploading photos.");
			const { files, ...fields } = values;
			const images = await uploadMediaFiles({ files: files.map((file: File) => ({ file, mediaKind: "image" as const })), userId: user.id, purpose: "listing", itemType: "SERVICE", onProgress: setUploadProgress });
			const response = await axios.post("/api/items/add", { ...fields, images });
			setUploadProgress(100);
			toast({ title: common.successTitle, status: "success", description: response.data.msg, isClosable: true });
			await router.push("/items/" + response.data.itemId);
		} catch (error: any) {
			toast({ title: common.errorTitle, status: "error", description: error?.response?.data?.err || error?.message || common.submitError, isClosable: true });
		} finally {
			actions.setSubmitting(false);
		}
	};

	const nextStep = async (formik: any) => {
		const errors = await formik.validateForm();
		const touched = { ...formik.touched };
		fieldsByStep[step].forEach((field) => { touched[field] = true; });
		formik.setTouched(touched, false);
		if (fieldsByStep[step].some((field) => errors[field])) return;
		setStep((current) => Math.min(current + 1, steps.length - 1));
	};

	const choosePhotos = (event: ChangeEvent<HTMLInputElement>, formik: any) => {
		const chosen = Array.from(event.currentTarget.files || []);
		event.currentTarget.value = "";
		if (chosen.length > MAX_PHOTOS) {
			formik.setFieldError("files", common.wizard.maxPhotos);
			formik.setFieldTouched("files", true, false);
			return;
		}
		if (chosen.some((file) => file.size > MAX_PHOTO_SIZE)) {
			formik.setFieldError("files", common.photoSizeError);
			formik.setFieldTouched("files", true, false);
			return;
		}
		if (chosen.some((file) => !ALLOWED_PHOTO_TYPES.includes(file.type))) {
			formik.setFieldError("files", common.photoTypeError);
			formik.setFieldTouched("files", true, false);
			return;
		}
		previews.forEach((preview) => URL.revokeObjectURL(preview));
		setPreviews(chosen.map((file) => URL.createObjectURL(file)));
		formik.setFieldValue("files", chosen);
		formik.setFieldTouched("files", true, false);
	};

	const removePhoto = (index: number, formik: any) => {
		const nextFiles = formik.values.files.filter((_file: File, fileIndex: number) => fileIndex !== index);
		const nextPreviews = previews.filter((_preview, previewIndex) => previewIndex !== index);
		if (previews[index]) URL.revokeObjectURL(previews[index]);
		setPreviews(nextPreviews);
		formik.setFieldValue("files", nextFiles);
		formik.setFieldTouched("files", true, false);
	};

	return (
		<Formik
			initialValues={{
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
			}}
			onSubmit={onSubmit}
			validationSchema={schema}
			validateOnBlur
		>
			{(formik) => (
				<form onSubmit={formik.handleSubmit}>
					<Modal isOpen={formik.isSubmitting} closeOnOverlayClick={false} closeOnEsc={false} onClose={() => {}}>
						<ModalOverlay />
						<ModalContent p="10">
							<ModalBody display="flex" flexDirection="column" alignItems="center" justifyContent="center">
								<CircularProgress size="150px" value={uploadProgress}>
									<CircularProgressLabel>{uploadProgress}%</CircularProgressLabel>
								</CircularProgress>
								<Heading mt="4" fontSize="lg">{common.uploading}</Heading>
							</ModalBody>
						</ModalContent>
					</Modal>

					<ListingWizardProgress steps={steps} hints={hints} activeStep={step} stepLabel={common.wizard.step} ofLabel={common.wizard.of} />

					{step === 0 && <Flex direction="column" gap="5">
						<InputField formik={formik} label={common.title} name="title" placeholder={common.titleHint} required />
						<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
							<SelectField formik={formik} name="category" label={text.category} options={CATEGORIES.map((value) => [value, text.categories[value]])} required />
							<SelectField formik={formik} name="priceType" label={common.priceType} options={[["FIXED", common.fixed], ["NEGOTIABLE", common.negotiable]]} required />
							<InputField formik={formik} label={common.price} name="price" type="number" placeholder={common.priceHint} suffix={<Text>ETB</Text>} required />
						</SimpleGrid>
					</Flex>}

					{step === 1 && <Flex direction="column" gap="5">
						<InputField formik={formik} label={text.serviceArea} name="serviceArea" placeholder={text.serviceAreaHint} helperText={text.serviceAreaHint} />
						<FormControl isInvalid={Boolean(formik.touched.description && formik.errors.description)}>
							<FormLabel htmlFor="description">{text.description}</FormLabel>
							<Textarea id="description" name="description" value={formik.values.description} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder={text.description} variant="filled" maxLength={10000} />
							<FormErrorMessage>{String(formik.errors.description || "")}</FormErrorMessage>
						</FormControl>
					</Flex>}

					{step === 2 && <Flex direction="column" gap="5">
						<Text color={muted} fontSize="sm">{common.locationStepHint}</Text>
						<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
							<InputField formik={formik} label={text.region} name="region" placeholder={common.regionHint} required />
							<InputField formik={formik} label={text.city} name="city" placeholder={common.cityHint} required />
						</SimpleGrid>
					</Flex>}

					{step === 3 && <Flex direction="column" gap="5">
						<SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
							<ReviewCard label={common.title} value={formik.values.title || "—"} />
							<ReviewCard label={text.category} value={text.categories[formik.values.category] || "—"} />
							<ReviewCard label={common.price} value={"ETB " + Number(formik.values.price || 0).toLocaleString("en-US")} />
							<ReviewCard label={text.city} value={[formik.values.city, formik.values.region].filter(Boolean).join(", ") || "—"} />
							<ReviewCard label={text.serviceArea} value={formik.values.serviceArea || "—"} />
						</SimpleGrid>
						<FormControl isRequired isInvalid={Boolean(formik.touched.files && formik.errors.files)}>
							<Flex align="center" justify="space-between" gap="3" wrap="wrap">
								<FormLabel htmlFor="service-photos" mb="0">{common.photos}</FormLabel>
								<Text fontSize="xs" color={muted}>{formik.values.files.length}/{MAX_PHOTOS} {common.wizard.photosCount}</Text>
							</Flex>
							<Text color={muted} fontSize="sm" mt="2" mb="3">{common.wizard.photoHelp}</Text>
							<Input id="service-photos" type="file" name="files" accept="image/jpeg,image/png,image/webp,image/gif" multiple variant="filled" h="auto" minH="12" py="2" sx={{ "&::file-selector-button": { mr: 3, px: 3, py: 2, border: 0, borderRadius: "md", bg: uploadButtonBg, color: uploadButtonText, fontWeight: 600, cursor: "pointer" } }} onChange={(event) => choosePhotos(event, formik)} />
							<FormErrorMessage>{String(formik.errors.files || "")}</FormErrorMessage>
						</FormControl>
						<Grid templateColumns="repeat(auto-fill, minmax(145px, 1fr))" gap="4">
							{formik.values.files.map((file: File, index: number) => <Box key={file.name + "-" + index} position="relative" overflow="hidden" borderRadius="xl" border="1px solid" borderColor={panelBorder}>
								<Image alt={common.photoPreview + " " + (index + 1)} w="full" h="150px" objectFit="cover" src={previews[index]} />
								<Button type="button" aria-label={common.removePhoto + " " + (index + 1)} position="absolute" top="2" right="2" size="sm" minW="8" h="8" p="0" borderRadius="full" onClick={() => removePhoto(index, formik)}><MdClose /></Button>
							</Box>)}
						</Grid>
					</Flex>}

					<Flex justify="space-between" align="center" gap="3" mt={{ base: 6, md: 8 }} pt="5" borderTop="1px solid" borderColor={panelBorder}>
						<Button type="button" variant="ghost" onClick={() => router.push("/dashboard")} leftIcon={<MdClose />} display="inline-flex">{common.cancel}</Button>
						<Flex ml="auto" gap="3">
							{step > 0 && <Button type="button" variant="outline" leftIcon={<MdArrowBack />} onClick={() => setStep((current) => current - 1)}>{common.wizard.back}</Button>}
							{step < steps.length - 1 ? <Button type="button" colorScheme="orange" rightIcon={<MdArrowForward />} onClick={() => nextStep(formik)}>{common.wizard.next}</Button> : <Button type="submit" colorScheme="orange" leftIcon={<MdSave />} isLoading={formik.isSubmitting}>{common.submit}</Button>}
						</Flex>
					</Flex>
				</form>
			)}
		</Formik>
	);
};

function SelectField({ formik, name, label, options, required = false }: { formik: any; name: string; label: string; options: Array<[string, string]>; required?: boolean }) {
	return <FormControl isRequired={required} isInvalid={Boolean(formik.touched[name] && formik.errors[name])}>
		<FormLabel htmlFor={name} mb="2" fontSize="sm" fontWeight="semibold">{label}</FormLabel>
		<Select id={name} name={name} value={formik.values[name]} onChange={formik.handleChange} onBlur={formik.handleBlur} variant="filled" h="12">
			{options.map(([value, optionLabel]) => <option key={value} value={value}>{optionLabel}</option>)}
		</Select>
		<FormErrorMessage>{String(formik.errors[name] || "")}</FormErrorMessage>
	</FormControl>;
}

function ReviewCard({ label, value }: { label: string; value: string | number }) {
	const bg = useColorModeValue("gray.50", "whiteAlpha.50");
	const muted = useColorModeValue("gray.600", "gray.400");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	return <Box minW="0" p="4" bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
		<Text fontSize="xs" fontWeight="semibold" color={muted}>{label}</Text>
		<Text mt="1" fontWeight="semibold" wordBreak="break-word">{value || "—"}</Text>
	</Box>;
}
